// src/app/(app)/glossary/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { glossaryTermsArray, type GlossaryEntry } from '@/lib/glossary-data';
import { Search } from 'lucide-react';

export default function GlossaryPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGlossaryTerms = useMemo(() => {
    if (!searchTerm) {
      return glossaryTermsArray;
    }
    return glossaryTermsArray.filter((entry) =>
      entry.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.htmlDefinition.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">Glossary of Terms</CardTitle>
          <p className="text-muted-foreground">
            Definitions of key terms and concepts used within KJV Sentinel and related theological discussions.
          </p>
        </CardHeader>
        <CardContent>
          <div className="relative mb-6">
            <Input
              type="search"
              placeholder="Search glossary terms..."
              className="w-full pl-10 text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search glossary terms"
            />
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          </div>

          {filteredGlossaryTerms.length > 0 ? (
            <Accordion type="multiple" className="w-full">
              {filteredGlossaryTerms.map((entry) => (
                <AccordionItem value={entry.id} key={entry.id}>
                  <AccordionTrigger className="text-xl hover:no-underline text-primary">
                    {entry.term}
                  </AccordionTrigger>
                  <AccordionContent className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 leading-relaxed py-2 px-1">
                    <div dangerouslySetInnerHTML={{ __html: entry.htmlDefinition }} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-center text-muted-foreground py-8">No terms match your search criteria.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
