'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AuthCredentialsValidator,
  TAuthCredentialsValidator,
} from '@/lib/validators/account-credentials-validator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button, buttonVariants } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Icons } from '@/components/Icons';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const Page = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TAuthCredentialsValidator>({
    resolver: zodResolver(AuthCredentialsValidator),
  });

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async ({ email, password }: TAuthCredentialsValidator) => {
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        toast.success(`Verification email sent to ${email}.`);
        router.push(`/verify-email?to=${email}`);
      } else {
        const error = await res.json();
        toast.error(error.message || 'Signup failed.');
      }
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='container relative flex pt-20 flex-col items-center justify-center lg:px-0'>
      <div className='mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]'>
        <div className='flex flex-col items-center space-y-2 text-center'>
          <Icons.logo className='h-20 w-20' />
          <h1 className='text-2xl font-semibold tracking-tight'>
            Create an account
          </h1>

          <Link
            className={buttonVariants({
              variant: 'link',
              className: 'gap-1.5',
            })}
            href='/sign-in'
          >
            Already have an account? Sign-in
            <ArrowRight className='h-4 w-4' />
          </Link>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className='grid gap-6'>
          <div className='grid gap-1 py-2'>
            <Label htmlFor='email'>Email</Label>
            <Input
              {...register('email')}
              className={cn({
                'focus-visible:ring-red-500': errors.email,
              })}
              placeholder='you@example.com'
            />
            {errors?.email && (
              <p className='text-sm text-red-500'>{errors.email.message}</p>
            )}
          </div>

          <div className='grid gap-1 py-2'>
            <Label htmlFor='password'>Password</Label>
            <Input
              {...register('password')}
              type='password'
              className={cn({
                'focus-visible:ring-red-500': errors.password,
              })}
              placeholder='Password'
            />
            {errors?.password && (
              <p className='text-sm text-red-500'>{errors.password.message}</p>
            )}
          </div>

          <Button disabled={loading}>
            {loading ? 'Creating...' : 'Sign up'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Page;
