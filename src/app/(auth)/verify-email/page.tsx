import VerifyEmail from '@/components/VerifyEmail';
import Image from 'next/image';

interface PageProps {
  searchParams: {
    token?: string | string[];
    to?: string | string[];
  };
}

const VerifyEmailPage = ({ searchParams }: PageProps) => {
  const token = Array.isArray(searchParams.token)
    ? searchParams.token[0]
    : searchParams.token;

  const toEmail = Array.isArray(searchParams.to)
    ? searchParams.to[0]
    : searchParams.to;

  return (
    <div className='container relative flex pt-20 flex-col items-center justify-center lg:px-0'>
      <div className='mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]'>

        {token ? (
          <div className='grid gap-6'>
            <VerifyEmail token={token} />
          </div>
        ) : (
          <div className='flex h-full flex-col items-center justify-center space-y-1'>
            <div className='relative mb-4 h-60 w-60 text-muted-foreground'>
              <Image
                src='/hippo-email-sent.png'
                fill
                alt='zikistorez email sent image'
              />
            </div>

            <h3 className='font-semibold text-2xl'>Check your email</h3>

            <p className='text-muted-foreground text-center'>
              We&apos;ve sent a verification link to{' '}
              <span className='font-semibold'>
                {toEmail || 'your email'}.
              </span>
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default VerifyEmailPage;
