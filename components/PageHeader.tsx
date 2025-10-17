
import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="mb-8">
      <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-accent to-pink-500 bg-clip-text text-transparent pb-2">{title}</h1>
      {subtitle && <p className="text-light-text-secondary dark:text-dark-text-secondary mt-2">{subtitle}</p>}
    </div>
  );
};

export default PageHeader;
