/**
 * PPTX解析サービス
 *
 * 注: この実装は簡略化されたモックです。
 * 実際の実装では、pptx-parser や他のライブラリを使用して
 * PPTXファイルからテキストを抽出する必要があります。
 */

export interface SlideData {
  title: string
  text: string
}

export async function parsePptx(fileData: Blob): Promise<SlideData[]> {
  // TODO: 実際のPPTX解析ロジックを実装
  // 現在はモックデータを返す

  console.log('Parsing PPTX file...')

  // シミュレーション用の待機
  await new Promise(resolve => setTimeout(resolve, 1000))

  // モックスライドデータ
  const mockSlides: SlideData[] = [
    {
      title: 'Introduction',
      text: 'Welcome to this training presentation. In this session, we will cover the basic concepts and important points.'
    },
    {
      title: 'Overview',
      text: 'This slide provides an overview of the topics we will discuss today. Please pay attention to the key points highlighted.'
    },
    {
      title: 'Main Content',
      text: 'Here is the main content of our training. We will go through each section step by step to ensure understanding.'
    },
    {
      title: 'Summary',
      text: 'To summarize, we have covered the essential topics. Please review the materials and feel free to ask questions.'
    },
    {
      title: 'Conclusion',
      text: 'Thank you for attending this training session. We hope you found it informative and useful for your work.'
    }
  ]

  return mockSlides
}
