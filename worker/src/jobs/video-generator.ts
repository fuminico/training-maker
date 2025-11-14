import { supabase } from '../lib/supabase'
import { generateVideo } from '../services/video-service'

export async function handleVideoGenerationJob(job: any) {
  console.log(`Processing video generation job: ${job.id}`)

  try {
    // Get project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', job.project_id)
      .single()

    if (projectError || !project) {
      throw new Error('Project not found')
    }

    // Get project settings
    const { data: settings, error: settingsError } = await supabase
      .from('project_settings')
      .select('*')
      .eq('project_id', project.id)
      .single()

    if (settingsError || !settings) {
      throw new Error('Project settings not found')
    }

    // Get all slides with audio
    const { data: slides, error: slidesError } = await supabase
      .from('slides')
      .select('*')
      .eq('project_id', project.id)
      .order('slide_index', { ascending: true })

    if (slidesError || !slides || slides.length === 0) {
      throw new Error('No slides found')
    }

    // Check if all slides have audio
    const slidesWithoutAudio = slides.filter(s => !s.audio_file_path)
    if (slidesWithoutAudio.length > 0) {
      throw new Error(`${slidesWithoutAudio.length} slide(s) do not have audio`)
    }

    await supabase
      .from('jobs')
      .update({ progress: 10 })
      .eq('id', job.id)

    // Generate video
    const { videoPath, duration, fileSize } = await generateVideo({
      projectId: project.id,
      slides,
      settings,
      onProgress: async (progress: number) => {
        await supabase
          .from('jobs')
          .update({ progress: 10 + Math.floor(progress * 0.8) })
          .eq('id', job.id)
      },
    })

    await supabase
      .from('jobs')
      .update({ progress: 95 })
      .eq('id', job.id)

    // Save video to media_files
    const { error: mediaError } = await supabase
      .from('media_files')
      .insert({
        project_id: project.id,
        file_type: 'video',
        path: videoPath,
        duration_sec: duration,
        size_bytes: fileSize,
      })

    if (mediaError) {
      throw new Error(`Failed to save media file record: ${mediaError.message}`)
    }

    // Update project status
    await supabase
      .from('projects')
      .update({ status: 'completed' })
      .eq('id', project.id)

    // Mark job as success
    await supabase
      .from('jobs')
      .update({
        status: 'success',
        progress: 100,
        finished_at: new Date().toISOString(),
      })
      .eq('id', job.id)

    console.log(`Video generation job ${job.id} completed successfully`)
  } catch (error) {
    console.error(`Video generation job ${job.id} failed:`, error)

    // Update project status
    await supabase
      .from('projects')
      .update({ status: 'failed' })
      .eq('id', job.project_id)

    throw error
  }
}
