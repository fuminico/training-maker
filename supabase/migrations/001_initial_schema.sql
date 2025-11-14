-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Table: profiles
-- ユーザープロフィール（Supabase Authと同期）
-- =====================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'trainer' CHECK (role IN ('trainer', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- Table: projects
-- 研修プロジェクト
-- =====================================================
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'editing', 'audio_generating', 'video_generating', 'completed', 'failed')),
    pptx_file_path TEXT,
    slide_count INTEGER NOT NULL DEFAULT 0,
    total_estimated_seconds INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_projects_status ON projects(status);

-- =====================================================
-- Table: project_settings
-- プロジェクトごとのデフォルト音声設定
-- =====================================================
CREATE TABLE project_settings (
    project_id UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
    default_voice TEXT NOT NULL DEFAULT 'female_bright',
    default_speed NUMERIC(3, 2) NOT NULL DEFAULT 1.0 CHECK (default_speed >= 0.5 AND default_speed <= 2.0),
    default_pause_ms INTEGER NOT NULL DEFAULT 500 CHECK (default_pause_ms >= 0),
    video_resolution TEXT NOT NULL DEFAULT '1280x720',
    video_fps INTEGER NOT NULL DEFAULT 30 CHECK (video_fps > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- Table: slides
-- スライドごとのテキスト・原稿・TTS設定
-- =====================================================
CREATE TABLE slides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    slide_index INTEGER NOT NULL,
    title TEXT,
    original_text TEXT,
    generated_script TEXT,
    edited_script TEXT,
    char_count INTEGER NOT NULL DEFAULT 0,
    estimated_seconds INTEGER NOT NULL DEFAULT 0,
    tts_voice_override TEXT,
    tts_speed_override NUMERIC(3, 2) CHECK (tts_speed_override IS NULL OR (tts_speed_override >= 0.5 AND tts_speed_override <= 2.0)),
    audio_file_path TEXT,
    slide_image_path TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'tts_pending', 'tts_generating', 'tts_done', 'tts_failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, slide_index)
);

-- Index for faster queries
CREATE INDEX idx_slides_project_id ON slides(project_id);
CREATE INDEX idx_slides_status ON slides(status);

-- =====================================================
-- Table: jobs
-- 非同期処理ジョブ（PPTX解析、音声生成、動画生成）
-- =====================================================
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL CHECK (job_type IN ('pptx_parse', 'tts_generation', 'video_generation')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'failed', 'cancelled')),
    payload JSONB,
    progress NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ
);

-- Index for faster queries
CREATE INDEX idx_jobs_project_id ON jobs(project_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);

-- =====================================================
-- Table: media_files
-- メディアファイル管理（PPTX、スライド画像、音声、動画）
-- =====================================================
CREATE TABLE media_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    slide_id UUID REFERENCES slides(id) ON DELETE CASCADE,
    file_type TEXT NOT NULL CHECK (file_type IN ('pptx', 'slide_image', 'audio', 'video')),
    path TEXT NOT NULL,
    duration_sec NUMERIC(10, 2),
    size_bytes BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_media_files_project_id ON media_files(project_id);
CREATE INDEX idx_media_files_slide_id ON media_files(slide_id);
CREATE INDEX idx_media_files_file_type ON media_files(file_type);

-- =====================================================
-- Functions and Triggers
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_settings_updated_at BEFORE UPDATE ON project_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_slides_updated_at BEFORE UPDATE ON slides
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create project_settings when a project is created
CREATE OR REPLACE FUNCTION create_project_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO project_settings (project_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_project_settings
AFTER INSERT ON projects
FOR EACH ROW EXECUTE FUNCTION create_project_settings();

-- Function to update project.slide_count when slides are added/removed
CREATE OR REPLACE FUNCTION update_project_slide_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE projects
    SET slide_count = (
        SELECT COUNT(*)
        FROM slides
        WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
    )
    WHERE id = COALESCE(NEW.project_id, OLD.project_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_slide_count
AFTER INSERT OR DELETE ON slides
FOR EACH ROW EXECUTE FUNCTION update_project_slide_count();

-- Function to update project.total_estimated_seconds when slides are updated
CREATE OR REPLACE FUNCTION update_project_total_time()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE projects
    SET total_estimated_seconds = (
        SELECT COALESCE(SUM(estimated_seconds), 0)
        FROM slides
        WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
    )
    WHERE id = COALESCE(NEW.project_id, OLD.project_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_total_time
AFTER INSERT OR UPDATE OR DELETE ON slides
FOR EACH ROW EXECUTE FUNCTION update_project_total_time();

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Projects policies
CREATE POLICY "Users can view their own projects"
    ON projects FOR SELECT
    USING (owner_id = auth.uid());

CREATE POLICY "Users can create their own projects"
    ON projects FOR INSERT
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own projects"
    ON projects FOR UPDATE
    USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own projects"
    ON projects FOR DELETE
    USING (owner_id = auth.uid());

CREATE POLICY "Admins can view all projects"
    ON projects FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Project settings policies
CREATE POLICY "Users can view settings of their own projects"
    ON project_settings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_settings.project_id
            AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update settings of their own projects"
    ON project_settings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_settings.project_id
            AND projects.owner_id = auth.uid()
        )
    );

-- Slides policies
CREATE POLICY "Users can view slides of their own projects"
    ON slides FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = slides.project_id
            AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can create slides in their own projects"
    ON slides FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = slides.project_id
            AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update slides in their own projects"
    ON slides FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = slides.project_id
            AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete slides in their own projects"
    ON slides FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = slides.project_id
            AND projects.owner_id = auth.uid()
        )
    );

-- Jobs policies
CREATE POLICY "Users can view jobs of their own projects"
    ON jobs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = jobs.project_id
            AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can create jobs for their own projects"
    ON jobs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = jobs.project_id
            AND projects.owner_id = auth.uid()
        )
    );

-- Media files policies
CREATE POLICY "Users can view media files of their own projects"
    ON media_files FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = media_files.project_id
            AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can create media files in their own projects"
    ON media_files FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = media_files.project_id
            AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete media files from their own projects"
    ON media_files FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = media_files.project_id
            AND projects.owner_id = auth.uid()
        )
    );
