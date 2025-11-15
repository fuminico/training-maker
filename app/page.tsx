import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-5xl font-bold mb-6 text-gray-900">Training Maker</h1>
        <p className="text-xl text-gray-600 mb-4">
          研修動画自動生成ツール
        </p>
        <p className="text-base text-gray-500 mb-8">
          PowerPointから研修動画を自動生成します
        </p>
        
        <div className="flex gap-4 justify-center">
          <Link
            href="/projects"
            className="inline-block rounded-md bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            プロジェクト一覧
          </Link>
          <Link
            href="/login"
            className="inline-block rounded-md bg-white px-6 py-3 text-base font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            ログイン
          </Link>
        </div>
        
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-lg mb-2">1. PPTXアップロード</h3>
            <p className="text-sm text-gray-600">PowerPointファイルをアップロードして解析</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-lg mb-2">2. 音声生成</h3>
            <p className="text-sm text-gray-600">各スライドのノートから自動でナレーション生成</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-lg mb-2">3. 動画出力</h3>
            <p className="text-sm text-gray-600">スライドと音声を組み合わせて動画を生成</p>
          </div>
        </div>
      </div>
    </div>
  );
}
