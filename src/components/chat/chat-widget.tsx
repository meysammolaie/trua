
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
import { Bot, User, Send, X, Loader2 } from "lucide-react";
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
  const [mode, setMode] = useState<ChatMode>('text');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const SpeechRecognition = isClient ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

  useEffect(() => {
    setIsClient(true);
  }, []);

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
      if (mode === "voice") {
          const result = await voiceChat({ message: messageText });
          const botMessage: Message = { sender: "bot", text: result.text };
          setMessages((prev) => [...prev, botMessage]);
          
          if(audioRef.current) {
            audioRef.current.src = result.audio;
            audioRef.current.play();
            audioRef.current.onplay = () => setIsSpeaking(true);
            audioRef.current.onended = () => {
                setIsSpeaking(false);
                if (recognitionRef.current && mode === "voice" && isOpen) {
                    recognitionRef.current.start();
                }
            };
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
            setMessages([{ sender: 'bot', text: 'سلام! من دستیار هوشمند Trusva هستم. چطور می‌توانم به شما کمک کنم؟ می‌توانید در مورد نحوه محاسبه سود، امنیت یا نقدشوندگی از من بپرسید.' }]);
        }, 500);
        return () => clearTimeout(timer);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (mode !== "voice" || !SpeechRecognition || !isOpen) {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'fa-IR';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
    };
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleSend(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();

    return () => {
        if(recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, isOpen, SpeechRecognition]);

  
  const { toast } = useToast();

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
                    <CardDescription>پشتیبان هوشمند شما</CardDescription>
                </div>
            </div>
            {!isEmbedded && (
                <Button variant="ghost" size="icon" onClick={toggleOpen}>
                    <X className="h-4 w-4" />
                </Button>
            )}
        </CardHeader>
        
        <div className="p-2 border-b">
            <div className="bg-muted p-1 rounded-lg flex">
                <AnimatePresence>
                    {['text', 'voice'].map((item) => (
                        <Button 
                            key={item}
                            onClick={() => setMode(item as ChatMode)}
                            className={cn(
                                "flex-1 relative transition-colors h-8",
                                mode === item ? "text-foreground" : "text-muted-foreground bg-transparent hover:bg-transparent"
                            )}
                            variant="ghost"
                        >
                             {mode === item && (
                                <motion.div
                                    layoutId="chatModePill"
                                    className="absolute inset-0 bg-background rounded-md z-0"
                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                />
                             )}
                            <span className="relative z-10">{item === 'text' ? 'چت متنی' : 'گفتگوی زنده صوتی'}</span>
                        </Button>
                    ))}
                </AnimatePresence>
            </div>
        </div>

         {mode === 'text' ? (
            <div className="flex flex-col flex-1">
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
                        placeholder="پیام خود را تایپ کنید..."
                        disabled={isLoading}
                        className="flex-1"
                        />
                        <Button type="submit" size="icon" disabled={isLoading}>
                        <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </CardFooter>
            </div>
         ) : (
             <div className="flex flex-col flex-1 items-center justify-center m-0">
                 <motion.div 
                    animate={
                        isListening ? { scale: [1, 1.1, 1] } : 
                        isSpeaking ? { scaleY: [1, 1.1, 1], y: [0, -5, 0] } : 
                        { scale: 1 }
                    }
                    transition={{ 
                        repeat: isListening || isSpeaking ? Infinity : 0, 
                        duration: isListening ? 1.5 : 0.6
                    }}
                >
                    <Bot className={cn("w-24 h-24 drop-shadow-lg", isListening ? "text-green-400" : "text-primary")}/>
                </motion.div>
                <p className="mt-4 text-lg font-semibold">{isListening ? "در حال گوش دادن..." : isSpeaking ? "در حال صحبت کردن..." : "من آماده‌ام!"}</p>
                <p className="mt-1 text-sm text-muted-foreground">برای صحبت کردن آماده‌ام</p>
                 {isLoading && messages.length > 0 && <p className="mt-4 text-sm text-yellow-400">در حال پردازش...</p>}
            </div>
         )}
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
            className="fixed bottom-24 left-4 z-50"
          >
           {ChatWindow}
          </motion.div>
        )}
      </AnimatePresence>
      <div
        className="fixed bottom-4 left-4 z-50 cursor-pointer group"
        onClick={toggleOpen}
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
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ repeat: Infinity, duration: 2.5 }}
                    >
                        <Avatar className="w-20 h-20 border-4 border-primary/50 shadow-2xl">
                           <AvatarImage src="https://placehold.co/80x80/17192A/FBBF24" alt="AI Assistant" data-ai-hint="robot assistant"/>
                            <AvatarFallback>AI</AvatarFallback>
                        </Avatar>
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
      </div>
    </>
  );
}
