'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

interface TabsContextValue {
  active: string;
  setActive: (v: string) => void;
}
const TabsContext = React.createContext<TabsContextValue>({ active: '', setActive: () => {} });

interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}
const Tabs = ({ defaultValue = '', value, onValueChange, children, className }: TabsProps) => {
  const [internal, setInternal] = React.useState(defaultValue);
  const active = value ?? internal;
  const setActive = (v: string) => { setInternal(v); onValueChange?.(v); };
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className={cn('', className)}>{children}</div>
    </TabsContext.Provider>
  );
};

const TabsList = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('flex gap-1 rounded-lg bg-gray-800 p-1', className)}>{children}</div>
);

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}
const TabsTrigger = ({ value, children, className }: TabsTriggerProps) => {
  const { active, setActive } = React.useContext(TabsContext);
  return (
    <button
      type="button"
      onClick={() => setActive(value)}
      className={cn(
        'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all',
        active === value
          ? 'bg-orange-500 text-white shadow'
          : 'text-gray-400 hover:text-white',
        className
      )}
    >
      {children}
    </button>
  );
};

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}
const TabsContent = ({ value, children, className }: TabsContentProps) => {
  const { active } = React.useContext(TabsContext);
  if (active !== value) return null;
  return <div className={cn('mt-4', className)}>{children}</div>;
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
