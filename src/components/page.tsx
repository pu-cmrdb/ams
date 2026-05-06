import { cn } from '@/lib/utils';

import type { HTMLAttributes } from 'react';

type PageContainerProps = Readonly<HTMLAttributes<HTMLDivElement>>;

export function PageContainer({ className, ...props }: PageContainerProps) {
  return (
    <div className="space-y-8 p-4 md:p-8 xl:p-16">
      <div className={cn('space-y-12 p-4', className)} {...props} />
    </div>
  );
}

type PageHeaderProps = Readonly<HTMLAttributes<HTMLElement>>;

export function PageHeader({ className, ...props }: PageHeaderProps) {
  return <header className={cn('space-y-4', className)} {...props} />;
}

type PageTitleProps = Readonly<HTMLAttributes<HTMLHeadingElement>>;

export function PageTitle({ className, ...props }: PageTitleProps) {
  return <h1 className={cn('font-medium text-3xl', className)} {...props} />;
}

type PageDescriptionProps = Readonly<HTMLAttributes<HTMLParagraphElement>>;

export function PageDescription({ className, ...props }: PageDescriptionProps) {
  return (
    <p className={cn('text-lg text-muted-foreground', className)} {...props} />
  );
}
