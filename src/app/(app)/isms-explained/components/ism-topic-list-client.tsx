
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
// import { IsmTopicViewer } from "./ism-topic-viewer"; // If you plan to use it from here

interface IsmTopic {
  id: string;
  name: string;
  brief: string;
}

interface IsmTopicListClientProps {
  topics: IsmTopic[];
  // onTopicSelect: (topicId: string | null) => void; // If IsmTopicViewer interaction is handled here
}

export function IsmTopicListClient({ topics }: IsmTopicListClientProps) {
  // const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  // const handleExamineTopic = (topicId: string) => {
  //   // Here you would typically set the selected topic to show in IsmTopicViewer
  //   // For now, it just alerts as per original placeholder logic.
  //   // setSelectedTopicId(topicId);
  //   // onTopicSelect(topicId);
  //   alert(`Placeholder: View details for ${topics.find(t => t.id === topicId)?.name}. Full content viewer coming soon.`);
  // };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {topics.map((topic) => (
          <Card key={topic.id} className="hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl">{topic.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 h-16 overflow-hidden">{topic.brief}</p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => alert(`Placeholder: View details for ${topic.name}. Full content viewer coming soon.`)}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Examine Topic
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* 
        If you want IsmTopicViewer to be part of this client component:
        <IsmTopicViewer selectedTopicId={selectedTopicId} /> 
      */}
    </>
  );
}
