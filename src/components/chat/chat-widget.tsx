
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
  const [isClient, setIsClient] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  
  const [activeMode, setActiveMode] = useState<'voice' | 'text'>('text');

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
            text: "سلام! من دستیار هوشمند Trusva هستم. برای شروع گفتگو، پیام خود را بنویسید یا به حالت گفتگوی صوتی بروید.",
          },
        ]);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, messages.length, isEmbedded]);

 useEffect(() => {
    if (!isSpeechSupported || !isOpen || activeMode !== 'voice') {
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
            if (!isSpeaking && activeMode === 'voice') {
                 setTimeout(() => recognitionRef.current?.start(), 100);
            }
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
    
    if (!isListening && !isSpeaking) {
        recognitionRef.current.start();
    }

    return () => {
        recognitionRef.current?.abort();
    };
}, [isSpeechSupported, isOpen, activeMode, isSpeaking]);


  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
        setIsSpeaking(true);
        recognitionRef.current?.abort();
    };
    const handleEnd = () => {
        setIsSpeaking(false);
        if(isOpen && activeMode === 'voice') {
            recognitionRef.current?.start();
        }
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('ended', handleEnd);
    audio.addEventListener('pause', handleEnd);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('ended', handleEnd);
      audio.removeEventListener('pause', handleEnd);
    };
  }, [audioRef, isOpen, activeMode]);


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
              <div
                className={cn(
                  "h-2 w-2 rounded-full transition-colors",
                   isSpeaking ? "bg-red-500 animate-pulse" : (isListening && activeMode === 'voice' ? "bg-green-500 animate-pulse" : "bg-muted-foreground")
                )}
              />
              <CardDescription>
                 {isSpeaking ? "در حال صحبت..." : (isListening && activeMode === 'voice' ? "در حال گوش دادن..." : "آنلاین")}
              </CardDescription>
            </div>
          </div>
        </div>
        {!isEmbedded && (
          <Button variant="ghost" size="icon" onClick={toggleOpen}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      
       <div className="px-4 pb-2">
         <div className="relative flex items-center justify-center p-1 bg-muted rounded-full">
            <motion.div
                layoutId="activeModeHighlight"
                className="absolute h-full w-1/2 bg-background rounded-full shadow-sm"
                animate={{ x: activeMode === 'text' ? '-50%' : '50%' }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
             <Button
                variant="ghost"
                className="w-1/2 z-10 rounded-full"
                onClick={() => setActiveMode('text')}
            >
                چت متنی
            </Button>
            <Button
                variant="ghost"
                className="w-1/2 z-10 rounded-full"
                onClick={() => setActiveMode('voice')}
            >
                گفتگوی زنده صوتی
            </Button>
        </div>
       </div>

      <CardContent className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
            {activeMode === 'text' && (
                 <motion.div
                    key="text-mode"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="h-full flex flex-col"
                 >
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
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="پیام خود را تایپ کنید..."
                            disabled={isLoading}
                        />
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                            <Send className="h-4 w-4" />
                            )}
                        </Button>
                        </form>
                    </div>
                </motion.div>
            )}

            {activeMode === 'voice' && (
                 <motion.div
                    key="voice-mode"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="h-full flex flex-col items-center justify-center gap-4 p-6"
                 >
                    <motion.div
                        animate={{
                            scale: isListening ? 1.05 : 1,
                            boxShadow: isListening ? '0 0 25px hsl(var(--primary))' : '0 0 0px hsl(var(--primary))',
                            height: isSpeaking ? ['192px', '180px', '192px'] : '192px',
                        }}
                        transition={{
                            height: { repeat: Infinity, duration: 0.4, ease: 'easeInOut' },
                            default: { type: 'spring', stiffness: 300, damping: 20 }
                        }}
                        className="w-48 h-48 rounded-full bg-card"
                    >
                        <Avatar className="w-full h-full">
                            <AvatarImage src="https://placehold.co/192x192/17192A/FBBF24" alt="AI Assistant" data-ai-hint="robot friendly"/>
                            <AvatarFallback>AI</AvatarFallback>
                        </Avatar>
                    </motion.div>
                    <p className="text-muted-foreground text-center min-h-[20px]">
                        {isSpeaking ? "..." : (isListening ? "در حال شنیدن..." : "من آماده‌ام!")}
                    </p>
                    <div className="text-xs text-muted-foreground text-center mt-4 h-4">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto"/> : `آخرین پیام: ${messages.filter(m=>m.sender==='user').slice(-1)[0]?.text || "..."}` }
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
