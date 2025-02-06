import { GetStaticProps } from 'next';
import clientPromise from '@/lib/mongodb';

export default function Home() {
  return <h1> Home </h1>;
}

export const getStaticProps: GetStaticProps = async () => {
  // You should remove this try-catch block once your MongoDB Cluster is fully provisioned
  try {
    await clientPromise;
  } catch (e: any) {
    if (e.code === 'ENOTFOUND') {
      // cluster is still provisioning
      return {
        props: {
          clusterStillProvisioning: true
        }
      };
    } else {
      throw new Error(`Connection limit reached. Please try again later.`);
    }
  }

  return {
    props: { },
    revalidate: 10
  };
};
