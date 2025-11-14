import { supabase } from '../lib/supabase'
import { parsePptx } from '../services/pptx-service'

export async function handlePptxParseJob(job: any) {
  console.log(`Processing PPTX parse job: ${job.id}`)

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

    if (!project.pptx_file_path) {
      throw new Error('PPTX file path not found')
    }

    // Update progress
    await supabase
      .from('jobs')
      .update({ progress: 10 })
      .eq('id', job.id)

    // Download PPTX file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('training-files')
      .download(project.pptx_file_path)

    if (downloadError || !fileData) {
      throw new Error(`Failed to download PPTX: ${downloadError?.message}`)
    }

    await supabase
      .from('jobs')
      .update({ progress: 30 })
      .eq('id', job.id)

    // Parse PPTX
    const slides = await parsePptx(fileData)

    await supabase
      .from('jobs')
      .update({ progress: 70 })
      .eq('id', job.id)

    // Delete existing slides if reparse
    if (job.payload?.reparse) {
      await supabase
        .from('slides')
        .delete()
        .eq('project_id', project.id)
    }

    // Insert slides
    const slideRecords = slides.map((slide, index) => ({
      project_id: project.id,
      slide_index: index + 1,
      title: slide.title,
      original_text: slide.text,
      generated_script: slide.text, // For now, use original text as generated script
      char_count: slide.text.length,
      estimated_seconds: Math.ceil(slide.text.length / 6.67),
      status: 'draft'
    }))

    const { error: insertError } = await supabase
      .from('slides')
      .insert(slideRecords)

    if (insertError) {
      throw new Error(`Failed to insert slides: ${insertError.message}`)
    }

    await supabase
      .from('jobs')
      .update({ progress: 90 })
      .eq('id', job.id)

    // Update project
    await supabase
      .from('projects')
      .update({
        status: 'editing',
        slide_count: slides.length
      })
      .eq('id', project.id)

    // Mark job as success
    await supabase
      .from('jobs')
      .update({
        status: 'success',
        progress: 100,
        finished_at: new Date().toISOString()
      })
      .eq('id', job.id)

    console.log(`PPTX parse job ${job.id} completed successfully`)
  } catch (error) {
    console.error(`PPTX parse job ${job.id} failed:`, error)
    throw error
  }
}
