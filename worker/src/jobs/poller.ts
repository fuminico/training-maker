import { supabase } from '../lib/supabase'
import { handlePptxParseJob } from './pptx-parser'
import { handleTtsGenerationJob } from './tts-generator'
import { handleVideoGenerationJob } from './video-generator'

const POLL_INTERVAL = parseInt(process.env.JOB_POLL_INTERVAL || '5000', 10)

export function startJobPoller() {
  console.log(`Starting job poller (interval: ${POLL_INTERVAL}ms)`)

  setInterval(async () => {
    try {
      await pollAndProcessJobs()
    } catch (error) {
      console.error('Error in job poller:', error)
    }
  }, POLL_INTERVAL)
}

async function pollAndProcessJobs() {
  // Get pending jobs
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(5)

  if (error) {
    console.error('Error fetching jobs:', error)
    return
  }

  if (!jobs || jobs.length === 0) {
    return
  }

  console.log(`Found ${jobs.length} pending job(s)`)

  // Process each job
  for (const job of jobs) {
    try {
      // Mark job as running
      await supabase
        .from('jobs')
        .update({
          status: 'running',
          started_at: new Date().toISOString()
        })
        .eq('id', job.id)

      // Route to appropriate handler
      switch (job.job_type) {
        case 'pptx_parse':
          await handlePptxParseJob(job)
          break
        case 'tts_generation':
          await handleTtsGenerationJob(job)
          break
        case 'video_generation':
          await handleVideoGenerationJob(job)
          break
        default:
          console.error(`Unknown job type: ${job.job_type}`)
          await supabase
            .from('jobs')
            .update({
              status: 'failed',
              error_message: `Unknown job type: ${job.job_type}`,
              finished_at: new Date().toISOString()
            })
            .eq('id', job.id)
      }
    } catch (error) {
      console.error(`Error processing job ${job.id}:`, error)

      // Mark job as failed
      await supabase
        .from('jobs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          finished_at: new Date().toISOString()
        })
        .eq('id', job.id)
    }
  }
}
