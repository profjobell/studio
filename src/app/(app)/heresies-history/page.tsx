
// src/app/(app)/heresies-history/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookMarked, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Major Heresies in Christian History - KJV Sentinel",
  description: "An overview of major heresies and heterodox movements throughout Christian history, examined from a KJV 1611 perspective.",
};

const earlyHeresies = [
  { name: "Ebionism", description: "Jesus human, not divine; Jewish Law required." },
  { name: "Gnosticism", description: "Secret knowledge for salvation; material world evil." },
  { name: "Docetism", description: "Jesus’ body illusory, purely divine." },
  { name: "Marcionism", description: "Old Testament God distinct from New Testament God." },
  { name: "Montanism", description: "New prophecies supersede apostolic teaching." },
  { name: "Adoptionism", description: "Jesus adopted as Son, not eternally divine." },
  { name: "Sabellianism", description: "God as one person in three modes, not Trinity." },
  { name: "Arianism", description: "Jesus created, not co-eternal with Father." },
  { name: "Manichaeism", description: "Dualistic good vs. evil; matter evil." },
  { name: "Donatism", description: "Sacramental validity tied to clergy purity." },
];

const post18thCenturyHeresies = [
  { name: "Unitarianism", description: "God one person; Jesus not divine." },
  { name: "Mormonism", description: "God and Jesus distinct beings; humans can become gods." },
  { name: "Jehovah’s Witnesses", description: "Jesus created; no Trinity." },
  { name: "Christian Science", description: "Matter illusory; no atonement." },
  { name: "Seventh-day Adventism", description: "Investigative judgment; Ellen G. White’s authority." },
  { name: "Oneness Pentecostalism", description: "Modalist God; baptism in Jesus’ name." },
  { name: "New Thought", description: "God as mind; Jesus not unique." },
  { name: "Theosophy", description: "Jesus one of many masters." },
  { name: "Prosperity Gospel", description: "Faith ensures wealth and health." },
  { name: "Progressive Christianity", description: "Denies core doctrines; emphasizes social justice." },
  { name: "New Apostolic Reformation", description: "Modern apostles/prophets with supreme authority; extra-biblical revelations; dominionism via Seven Mountain Mandate." },
];

export default function HeresiesHistoryPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <ShieldAlert className="mr-3 h-8 w-8 text-primary" />
            Major Heresies in Christian History
            </h1>
            <p className="text-muted-foreground mt-1">
            An overview of significant deviations from orthodox Christian doctrine, based on KJV 1611 understanding.
            </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/isms-explained">Back to Isms Explained</Link>
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Early Apostolic and Ante-Nicene Heresies (1st–4th Century)</CardTitle>
          <CardDescription>
            Deviations that emerged in the early centuries of the Church.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {earlyHeresies.map((heresy, index) => (
              <AccordionItem value={`early-${index}`} key={`early-${index}`}>
                <AccordionTrigger className="text-lg hover:no-underline text-primary/90">
                  {heresy.name}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-foreground/80 leading-relaxed py-2 px-1">
                  {heresy.description}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Post-18th Century Heresies and Heterodox Movements</CardTitle>
          <CardDescription>
            Movements and teachings that arose from the Enlightenment period onwards.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {post18thCenturyHeresies.map((heresy, index) => (
              <AccordionItem value={`post18-${index}`} key={`post18-${index}`}>
                <AccordionTrigger className="text-lg hover:no-underline text-primary/90">
                  {heresy.name}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-foreground/80 leading-relaxed py-2 px-1">
                  {heresy.description}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

       <Card className="mt-6 bg-muted/50">
        <CardHeader>
          <CardTitle className="text-xl flex items-center"><BookMarked className="mr-2 h-5 w-5 text-primary"/>Note on Discernment</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This list is not exhaustive but covers significant historical deviations. Understanding these heresies can aid in discerning truth and recognizing unbiblical teachings. It is crucial to compare all teachings against the sole authority of the King James Version (1611) Bible, seeking wisdom and guidance from the Holy Spirit.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            For more detailed explanations and AI-assisted insights on these and other 'isms', please visit the <Link href="/isms-explained" className="text-primary hover:underline">Isms Explained</Link> section.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
