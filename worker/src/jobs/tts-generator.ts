import { supabase } from '../lib/supabase'
import { generateTTS } from '../services/tts-service'

export async function handleTtsGenerationJob(job: any) {
  console.log(`Processing TTS generation job: ${job.id}`)

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

    // Get slides to process
    let slidesQuery = supabase
      .from('slides')
      .select('*')
      .eq('project_id', project.id)
      .order('slide_index', { ascending: true })

    // Filter by slide IDs if specified
    if (job.payload?.slideIds && job.payload.slideIds.length > 0) {
      slidesQuery = slidesQuery.in('id', job.payload.slideIds)
    }

    const { data: slides, error: slidesError } = await slidesQuery

    if (slidesError || !slides || slides.length === 0) {
      throw new Error('No slides found to process')
    }

    await supabase
      .from('jobs')
      .update({ progress: 10 })
      .eq('id', job.id)

    // Process each slide
    const totalSlides = slides.length
    for (let i = 0; i < totalSlides; i++) {
      const slide = slides[i]

      // Skip if audio already exists and not regenerating
      if (slide.audio_file_path && !job.payload?.regenerate) {
        console.log(`Skipping slide ${slide.id} - audio already exists`)
        continue
      }

      // Update slide status
      await supabase
        .from('slides')
        .update({ status: 'tts_generating' })
        .eq('id', slide.id)

      // Get script (use edited_script if available, otherwise generated_script)
      const script = slide.edited_script || slide.generated_script || ''

      if (!script) {
        console.log(`Skipping slide ${slide.id} - no script available`)
        continue
      }

      // Get voice and speed settings
      const voice = slide.tts_voice_override || settings.default_voice
      const speed = slide.tts_speed_override || settings.default_speed

      // Generate TTS
      const audioPath = await generateTTS({
        projectId: project.id,
        slideId: slide.id,
        slideIndex: slide.slide_index,
        text: script,
        voice,
        speed,
      })

      // Update slide with audio path
      await supabase
        .from('slides')
        .update({
          audio_file_path: audioPath,
          status: 'tts_done',
        })
        .eq('id', slide.id)

      // Update progress
      const progress = 10 + ((i + 1) / totalSlides) * 80
      await supabase
        .from('jobs')
        .update({ progress: Math.floor(progress) })
        .eq('id', job.id)
    }

    // Update project status
    await supabase
      .from('projects')
      .update({ status: 'editing' })
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

    console.log(`TTS generation job ${job.id} completed successfully`)
  } catch (error) {
    console.error(`TTS generation job ${job.id} failed:`, error)

    // Update project status
    await supabase
      .from('projects')
      .update({ status: 'failed' })
      .eq('id', job.project_id)

    throw error
  }
}
