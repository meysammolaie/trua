
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, Send, X, Loader2, AudioLines } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { voiceChat } from "@/ai/flows/voice-chat-flow";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useToast } from "@/hooks/use-toast";

interface Message {
  sender: "user" | "bot";
  text: string;
}

interface ChatWidgetProps {
  isEmbedded?: boolean;
}

export function ChatWidget({ isEmbedded = false }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(isEmbedded);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const SpeechRecognition = isClient
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;
  const isSpeechSupported = !!SpeechRecognition;

  const toggleOpen = () => {
    if (!isEmbedded) {
      setIsOpen(!isOpen);
    }
  };

  const handleSend = async (messageText: string) => {
    if (messageText.trim() === "" || isLoading) return;

    const userMessage: Message = { sender: "user", text: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await voiceChat({ message: messageText });
      const botMessage: Message = { sender: "bot", text: result.text };
      setMessages((prev) => [...prev, botMessage]);

      if (audioRef.current && result.audio) {
        audioRef.current.src = result.audio;
        audioRef.current.play();
      } else {
        if (isVoiceMode) {
            // If we are in voice mode but get no audio, exit voice mode.
             setTimeout(() => setIsVoiceMode(false), 500);
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        sender: "bot",
        text: "متاسفانه مشکلی در ارتباط با دستیار هوشمند پیش آمده. لطفاً دوباره تلاش کنید.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector(
        "div[data-radix-scroll-area-viewport]"
      );
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0 && !isEmbedded) {
      const timer = setTimeout(() => {
        setMessages([
          {
            sender: "bot",
            text: "سلام! من دستیار هوشمند Trusva هستم. برای شروع گفتگو، پیام خود را بنویسید یا روی آیکون گفتگوی زنده ضربه بزنید.",
          },
        ]);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, messages.length, isEmbedded]);

 useEffect(() => {
    if (!isSpeechSupported || !isVoiceMode) {
        recognitionRef.current?.abort();
        return;
    }

    if (!recognitionRef.current) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false; 
        recognition.lang = 'fa-IR';
        recognitionRef.current = recognition;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => {
            setIsListening(false);
            // Don't automatically restart. User has to tap again.
        };

        recognition.onerror = (event) => {
             if (event.error === 'no-speech' || event.error === 'aborted') {
                return;
            }
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript.trim();
            if (transcript) {
                handleSend(transcript);
            }
        };
    }
    
    return () => {
        recognitionRef.current?.abort();
    };
}, [isSpeechSupported, isVoiceMode]);


  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
        setIsSpeaking(true);
        recognitionRef.current?.stop();
    };
    const handleEnd = () => {
        setIsSpeaking(false);
        // After speaking, go back to text chat, ready for next interaction
        setTimeout(() => setIsVoiceMode(false), 500);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('ended', handleEnd);
    audio.addEventListener('pause', handleEnd);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('ended', handleEnd);
      audio.removeEventListener('pause', handleEnd);
    };
  }, [audioRef]);

  const openVoiceMode = () => {
    if (isSpeechSupported) {
        setIsVoiceMode(true);
        recognitionRef.current?.start();
    } else {
        toast({
            variant: "destructive",
            title: "مرورگر شما پشتیبانی نمی‌کند",
            description: "قابلیت گفتگوی صوتی در مرورگر شما فعال نیست."
        })
    }
  }


  const ChatWindow = (
    <Card
      className={cn(
        "w-[380px] h-[600px] flex flex-col shadow-2xl transition-all duration-300 overflow-hidden",
        isEmbedded && "w-full h-full shadow-none"
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage
              src="https://placehold.co/40x40/17192A/FBBF24"
              alt="AI Assistant"
              data-ai-hint="robot assistant"
            />
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>دستیار Trusva</CardTitle>
             <div className="flex items-center gap-1">
              <div className={cn("h-2 w-2 rounded-full transition-colors bg-green-500")}/>
              <CardDescription>آنلاین</CardDescription>
            </div>
          </div>
        </div>
        {!isEmbedded && (
          <Button variant="ghost" size="icon" onClick={toggleOpen}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0 relative">
        <div className="h-full flex flex-col">
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="flex flex-col gap-4">
                {messages.map((message, index) => (
                    <div
                    key={index}
                    className={cn(
                        "flex items-start gap-3",
                        message.sender === "user" ? "justify-end" : "justify-start"
                    )}
                    >
                    {message.sender === "bot" && (
                        <Avatar className="w-8 h-8">
                        <AvatarImage src="https://placehold.co/32x32/17192A/FBBF24" alt="Bot" data-ai-hint="robot assistant" />
                        <AvatarFallback>AI</AvatarFallback>
                        </Avatar>
                    )}
                    <div
                        className={cn(
                        "max-w-[75%] rounded-lg p-3 text-sm",
                        message.sender === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                    >
                        {message.text}
                    </div>
                    {message.sender === "user" && (
                        <Avatar className="w-8 h-8">
                        <AvatarImage src="https://placehold.co/32x32" alt="User" data-ai-hint="person user"/>
                        <AvatarFallback><User /></AvatarFallback>
                        </Avatar>
                    )}
                    </div>
                ))}
                </div>
            </ScrollArea>

            <div className="p-4 border-t">
                <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="flex items-center gap-2">
                    <Button type="button" variant="ghost" size="icon" onClick={openVoiceMode} disabled={isLoading}>
                        <AudioLines className="h-5 w-5" />
                    </Button>
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="پیام خود را تایپ کنید..."
                        disabled={isLoading}
                    />
                     <Button type="submit" disabled={isLoading || input.trim() === ""}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                     </Button>
                </form>
            </div>
        </div>
         <AnimatePresence>
          {isVoiceMode && (
             <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-6"
             >
                 <button onClick={() => setIsVoiceMode(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                    <X className="w-6 h-6"/>
                 </button>
                 <motion.div
                    animate={{
                        scale: isListening ? 1.05 : 1,
                        boxShadow: isListening ? '0 0 35px hsl(var(--primary))' : '0 0 0px hsl(var(--primary))',
                        height: isSpeaking ? ['96px', '88px', '96px'] : '96px',
                    }}
                    transition={{
                        height: { repeat: Infinity, duration: 0.4, ease: 'easeInOut' },
                        default: { type: 'spring', stiffness: 300, damping: 20 }
                    }}
                    className="w-24 h-24 rounded-full bg-card flex items-center justify-center cursor-pointer text-primary"
                    onClick={() => recognitionRef.current?.start()}
                >
                    <Bot className="w-12 h-12"/>
                </motion.div>
                 <p className="text-muted-foreground text-center min-h-[20px] font-semibold">
                    {isLoading ? "در حال پردازش..." : isSpeaking ? "..." : (isListening ? "در حال شنیدن..." : "برای صحبت کردن، روی من ضربه بزنید")}
                </p>
                <div className="text-xs text-muted-foreground text-center mt-4 h-4">
                   `آخرین پیام: ${messages.filter(m=>m.sender==='user').slice(-1)[0]?.text || "..."}` 
                </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );

  if (isEmbedded) {
    return (
      <>
        {ChatWindow}
        <audio ref={audioRef} hidden />
      </>
    );
  }

  return (
    <>
      <audio ref={audioRef} hidden />
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-4 left-4 z-50"
          >
            {ChatWindow}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        className="fixed bottom-4 left-4 z-50 cursor-pointer group"
        onClick={toggleOpen}
        aria-label="Toggle chat widget"
      >
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex flex-col items-center gap-2"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1], y: [0, -2, 0] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
                className="relative"
              >
                <Avatar className="w-20 h-20 border-4 border-primary/50 shadow-2xl">
                  <AvatarImage
                    src="https://placehold.co/80x80/17192A/FBBF24"
                    alt="AI Assistant"
                    data-ai-hint="robot assistant"
                  />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary"
                  animate={{ scale: [1, 1.4], opacity: [0.7, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
              <div className="bg-card/80 backdrop-blur-md text-card-foreground px-3 py-1 rounded-full text-xs shadow-lg">
                روی من ضربه بزن تا گفتگو کنیم
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isOpen && (
            <Button
              size="icon"
              className="rounded-full w-16 h-16 shadow-2xl"
              onClick={(e) => {
                e.stopPropagation();
                toggleOpen();
              }}
              aria-label="Close chat"
            >
              <motion.div
                key="close"
                initial={{ rotate: -90, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                exit={{ rotate: 90, scale: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="h-8 w-8" />
              </motion.div>
            </Button>
          )}
        </AnimatePresence>
      </button>
    </>
  );
}
