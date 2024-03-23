import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Atom,
  Code2,
  Container,
  Database,
  HardDrive,
  Server,
} from "lucide-react";
import { Button } from "./components/ui/button";
import { ScreenFitText } from "./components/ui/screenFitText";
import { Dialog, DialogContent, DialogTrigger } from "./components/ui/dialog";
import { Input } from "./components/ui/input";
import io from "socket.io-client";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "./components/ui/form";
import { toast } from "sonner";

const serverUrl = import.meta.env.VITE_SERVER_URL;

const formSchema = z.object({
  topic: z.string().min(1, { message: "Required" }),
});

const GenerateQuiz: React.FC<{ idle: boolean }> = ({ idle }) => {
  const [open, setOpen] = useState(false);
  const { mutateAsync: generate } = useMutation({
    mutationFn: async (body: { topic: string; count?: number }) => {
      const response = await fetch(serverUrl + "/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        if (response.status === 404) {
          toast("Wikipedia has never heard of that.");
        } else {
          toast("Uh oh! Something went wrong. There was a problem reaching the server.");
        }
      } else {
        toast("Success!");
      }
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await generate(values);
      setOpen(false);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Dialog onOpenChange={(o) => setOpen(o)} open={open}>
      <DialogTrigger asChild>
        <Button disabled={!idle}>{idle ? "Generate New Video" : "Generating Video..."}</Button>
      </DialogTrigger>
      <DialogContent className="indigo-card overflow-hidden">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between ">
                    <h1 className="card-title">Topic</h1>
                    <FormMessage className="text" />
                  </div>
                  <FormControl>
                    <Input placeholder="Jimi Hendrix" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button disabled={form.formState.isSubmitting} type="submit" className="w-full">
              {form.formState.isSubmitting ? "Generating..." : "Generate Video"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

const App: React.FC = ({}) => {
  const { data: videos } = useQuery({
    queryKey: ["videos"],
    queryFn: async () => {
      const response = await fetch(serverUrl + "/videos");
      if (!response.ok) {
        toast("Uh oh! Something went wrong. There was a problem reaching the server.");
      }
      const data = await response.json();
      setApiStatus(data.status);
      return data.videos;
    },
  });
  const queryClient = useQueryClient();
  const [videoIndex, setVideoIndex] = useState(0);
  const [apiStatus, setApiStatus] = useState("idle");

  useEffect(() => {
    const socket = io(serverUrl);
    socket.on("notification", (data: string) => {
      console.log(data);
      if (data === "completed") {
        queryClient.invalidateQueries({ queryKey: ["videos"] });
      } else {
        setApiStatus(data);
      }
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <>
      <div className="grid-bg w-full fixed -z-10" />
      <div className="h-screen flex-col xl:flex-row flex p-4 gap-4">
        <main className="flex-1 flex flex-col gap-4">
          <ScreenFitText />
          <div className="purple-card space-y-4">
            <h2 className="card-title">Summary</h2>
            <p className="text">
              WikiTrivia is a microservice-based automation tool designed to generate trivia
              questions based on a specified Wikipedia topic, and return a video short of these
              questions. It consists of several interconnected services each responsible for their
              own individual sections (e.g generate questions, audio, rendering) which are then
              combined to produce the finished product.
            </p>
          </div>
          <div className="flex-1 flex-col xl:flex-row flex gap-4">
            <div className="indigo-card flex-1 space-y-4">
              <h2 className="card-title">How It Works</h2>
              <ul className="text space-y-2 text-center">
                <li className="card bg-red-200/90">
                  <b>React Application:</b> Frontend UI.
                </li>
                <li className="protocol-card">
                  <ArrowDown className="icon-small" /> HTTP Request / Websocket
                  <ArrowUp className="icon-small" />
                </li>
                <li className="card bg-orange-200/90">
                  <b>Flask Server:</b> Handles API as a gateway.
                </li>
                <div className="flex gap-2">
                  <div className="space-y-2 flex-1">
                    <li className="protocol-card">
                      Publish / Consume <ArrowLeft className="icon-small" />
                      <ArrowRight className="icon-small" />
                    </li>
                    <li className="bg-yellow-200/90 card">
                      <b>Python Application:</b> Create questions with OpenAI.
                    </li>
                    <li className="protocol-card">
                      Publish / Consume <ArrowLeft className="icon-small" />
                      <ArrowRight className="icon-small" />
                    </li>
                    <li className="bg-yellow-200/90 card">
                      <b>Python Application:</b> Generate audio through TTS.
                    </li>
                    <li className="protocol-card">
                      Publish / Consume <ArrowLeft className="icon-small" />
                      <ArrowRight className="icon-small" />
                    </li>
                    <li className="bg-yellow-200/90 card">
                      <b>Node.js Application:</b> Render video with Remotion.
                    </li>
                    <li className="protocol-card">
                      Publish / Consume <ArrowLeft className="icon-small" />
                      <ArrowRight className="icon-small" />
                    </li>
                  </div>
                  <li
                    className="text-center card bg-pink-200/90"
                    style={{ writingMode: "vertical-lr", textOrientation: "sideways" }}
                  >
                    <b>RabbitMQ:</b> Message Queue
                  </li>
                </div>
              </ul>
            </div>
            <div className="indigo-card flex-1 flex flex-col space-y-4">
              <h2 className="card-title">Technologies Used</h2>
              <ul className="text flex flex-col flex-1 gap-2">
                <div className="flex gap-2 h-1/3">
                  <li className="square-card bg-red-200/90 flex-1">
                    <Atom strokeWidth={1} className="icon-large" />
                    <b>React</b>
                  </li>
                  <li className="square-card bg-red-200/90 flex-1">
                    <Code2 strokeWidth={1} className="icon-large" />
                    <b>Python</b>
                  </li>
                  <li className="square-card bg-red-200/90 flex-1">
                    <Code2 strokeWidth={1} className="icon-large" />
                    <b>NodeJS</b>
                  </li>
                </div>
                <div className="grid grid-cols-2 gap-2 grid-rows-2 flex-1">
                  <li className="video-card bg-orange-200/90">
                    <Database strokeWidth={1} className="icon-large" />
                    <b>MongoDB</b>
                  </li>
                  <li className="video-card bg-orange-200/90">
                    <HardDrive strokeWidth={1} className="icon-large" />
                    <b>S3</b>
                  </li>
                  <li className="video-card bg-yellow-200/90">
                    <Container strokeWidth={1} className="icon-large" />
                    <b>Docker</b>
                  </li>
                  <li className="video-card bg-yellow-200/90">
                    <Server strokeWidth={1} className="icon-large" />
                    <b>Kubernetes</b>
                  </li>
                </div>
              </ul>
            </div>
          </div>
        </main>
        <div className="xl:w-1/4 flex flex-col gap-4 relative">
          <div className="indigo-card w-full aspect-[9/16]">
            {!!videos && videos.length > 0 && (
              <video
                src={videos[videoIndex].url}
                controls
                className="object-cover border-2 w-full aspect-[9/16]"
              />
            )}
          </div>
          <div className="flex-1 purple-card space-y-4">
            <h2 className="card-title">Status</h2>
            <ul className="text capitalize space-y-2">
              <li>
                <b>Player:</b>&nbsp;
                {`${!!videos && videos.length > 0 ? videos[videoIndex].topic : ""} Trivia`}
              </li>
              <li>
                <b>Server:</b> {apiStatus}
              </li>
            </ul>
          </div>
          <div className="flex gap-4">
            <GenerateQuiz idle={apiStatus === "idle"} />
            <Button
              onClick={() => {
                if (!videos) return;

                if (videoIndex === 0) {
                  setVideoIndex(videos.length - 1);
                } else {
                  setVideoIndex(videoIndex - 1);
                }
              }}
              className="h-full flex-1"
            >
              <ArrowLeft className="icon-medium" />
            </Button>
            <Button
              onClick={() => {
                if (!videos) return;

                if (videoIndex === videos.length - 1) {
                  setVideoIndex(0);
                } else {
                  setVideoIndex(videoIndex + 1);
                }
              }}
              className="h-full flex-1"
            >
              <ArrowRight className="icon-medium" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
export default App;
