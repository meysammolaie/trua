
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
import { Bot, User, Send, X, Loader2, Mic } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { chat } from "@/ai/flows/chat-flow";
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

type ChatMode = 'text' | 'voice';

export function ChatWidget({ isEmbedded = false }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(isEmbedded);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const SpeechRecognition = isClient ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
  const isSpeechSupported = !!SpeechRecognition;

  const toggleOpen = () => {
    if (!isEmbedded) {
        setIsOpen(!isOpen);
    }
  };

  const toggleVoiceMode = () => {
    if (!isSpeechSupported) {
        toast({
            variant: "destructive",
            title: "مرورگر پشتیبانی نمی‌شود",
            description: "قابلیت تشخیص گفتار در مرورگر شما پشتیبانی نمی‌شود.",
        })
        return;
    }
    setIsVoiceMode(prev => !prev);
  }
  
  const handleSend = async (messageText: string) => {
    if (messageText.trim() === "" || isLoading) return;

    const userMessage: Message = { sender: "user", text: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      if (isVoiceMode) {
          const result = await voiceChat({ message: messageText });
          const botMessage: Message = { sender: "bot", text: result.text };
          setMessages((prev) => [...prev, botMessage]);
          
          if(audioRef.current && result.audio) {
            audioRef.current.src = result.audio;
            audioRef.current.play();
          }

      } else {
        const result = await chat({ message: messageText });
        const botMessage: Message = { sender: "bot", text: result.response };
        setMessages((prev) => [...prev, botMessage]);
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
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);
  
  useEffect(() => {
    if (isOpen && messages.length === 0) {
        const timer = setTimeout(() => {
            setMessages([{ sender: 'bot', text: 'سلام! من دستیار هوشمند Trusva هستم. چطور می‌توانم به شما کمک کنم؟' }]);
        }, 500);
        return () => clearTimeout(timer);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (!isVoiceMode || !isOpen || !isSpeechSupported) {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognitionRef.current = recognition;
    }

    const recognition = recognitionRef.current;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onend = () => {
      setIsListening(false);
      if (isVoiceMode && isOpen && !isSpeaking) {
         try {
            recognition.start();
         } catch(e) {
            // Ignore if already started
         }
      }
    };
    
    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
          return; // Gracefully handle cases where user stops talking or is silent.
      }
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      handleSend(transcript);
    };

    try {
        recognition.start();
    } catch(e) {
        // Ignore if already started.
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isVoiceMode, isOpen, isSpeechSupported, isSpeaking]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsSpeaking(true);
    const handleEnd = () => setIsSpeaking(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('ended', handleEnd);
    audio.addEventListener('pause', handleEnd);

    return () => {
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('ended', handleEnd);
        audio.removeEventListener('pause', handleEnd);
    }
  }, [audioRef]);

  
  const ChatWindow = (
     <Card className={cn(
        "w-[380px] h-[600px] flex flex-col shadow-2xl transition-all duration-300 overflow-hidden", 
        isEmbedded && "w-full h-full shadow-none",
        )}>
        <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
                 <Avatar>
                    <AvatarImage src="https://placehold.co/40x40/17192A/FBBF24" alt="AI Assistant" data-ai-hint="robot assistant"/>
                    <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                 <div>
                    <CardTitle>دستیار Trusva</CardTitle>
                     <div className="flex items-center gap-1">
                        <div className={cn("h-2 w-2 rounded-full", (isListening || isSpeaking) ? "bg-green-500 animate-pulse" : "bg-muted-foreground")} />
                        <CardDescription>{isSpeaking ? "در حال صحبت..." : isListening ? "در حال گوش دادن..." : "آنلاین"}</CardDescription>
                     </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={toggleVoiceMode} title="حالت مکالمه صوتی" disabled={!isSpeechSupported}>
                    <Mic className={cn("h-5 w-5", isVoiceMode ? "text-primary" : "text-muted-foreground")} />
                </Button>
                {!isEmbedded && (
                    <Button variant="ghost" size="icon" onClick={toggleOpen}>
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full p-6" ref={scrollAreaRef}>
                <div className="space-y-4">
                {messages.map((message, index) => (
                    <div
                    key={index}
                    className={`flex gap-2 ${
                        message.sender === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                    >
                        {message.sender === 'bot' && <Bot className="w-5 h-5 text-primary flex-shrink-0" />}
                    <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                        message.sender === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                    >
                        {message.text}
                    </div>
                        {message.sender === 'user' && <User className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
                    </div>
                ))}
                    {isLoading && (
                    <div className="flex justify-start gap-2">
                            <Bot className="w-5 h-5 text-primary flex-shrink-0" />
                            <div className="bg-muted rounded-lg px-3 py-2">
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                            </div>
                    </div>
                )}
                </div>
            </ScrollArea>
        </CardContent>
        <CardFooter>
            <form
                className="flex w-full items-center space-x-2"
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSend(input);
                }}
            >
                <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isVoiceMode ? "به شما گوش می‌دهم..." : "پیام خود را تایپ کنید..."}
                disabled={isLoading || isVoiceMode}
                className="flex-1"
                />
                <Button type="submit" size="icon" disabled={isLoading || isVoiceMode}>
                <Send className="h-4 w-4" />
                </Button>
            </form>
        </CardFooter>
    </Card>
  )

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
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="flex flex-col items-center gap-2"
                >
                    <motion.div
                        animate={{ scale: [1, 1.05, 1], y: [0, -2, 0] }}
                        transition={{ repeat: Infinity, duration: 2.5 }}
                        className="relative"
                    >
                        <Avatar className="w-20 h-20 border-4 border-primary/50 shadow-2xl">
                           <AvatarImage src="https://placehold.co/80x80/17192A/FBBF24" alt="AI Assistant" data-ai-hint="robot assistant"/>
                            <AvatarFallback>AI</AvatarFallback>
                        </Avatar>
                        <motion.div 
                          className="absolute inset-0 rounded-full border-2 border-primary"
                          animate={{ scale: [1, 1.4], opacity: [0.7, 0] }}
                          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
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
                    onClick={(e) => { e.stopPropagation(); toggleOpen(); }}
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
