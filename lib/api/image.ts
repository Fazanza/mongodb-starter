import clientPromise from '@/lib/mongodb';
import { remark } from 'remark';
import remarkMdx from 'remark-mdx';
import { serialize } from 'next-mdx-remote/serialize';

export interface ImageProps {
  promptNumber: number;
  choice: number;
}

export async function getMdxSource(postContents: string) {
  // Use remark plugins to convert markdown into HTML string
  const processedContent = await remark()
    // Native remark plugin that parses markdown into MDX
    .use(remarkMdx)
    .process(postContents);

  // Convert converted html to string format
  const contentHtml = String(processedContent);

  // Serialize the content string into MDX
  const mdxSource = await serialize(contentHtml);

  return mdxSource;
}

export async function updateImage(promptNumber: number, choice: number) {
  const client = await clientPromise;
  const collection = client.db('test').collection('images');
  return await collection.updateOne(
    { promptNumber },
    { $inc: { choice: 1 } }
  );
}
