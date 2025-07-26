
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

type ChatMode = "text" | "voice";

export function ChatWidget({ isEmbedded = false }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(isEmbedded);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>("text");
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

  const SpeechRecognition = isClient
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;
  const isSpeechSupported = !!SpeechRecognition;

  const toggleOpen = () => {
    if (!isEmbedded) {
      setIsOpen(!isOpen);
    }
  };

  const handleModeChange = (mode: ChatMode) => {
    if (mode === 'voice' && !isSpeechSupported) {
        toast({
            variant: "destructive",
            title: "مرورگر پشتیبانی نمی‌شود",
            description: "قابلیت تشخیص گفتار در مرورگر شما پشتیبانی نمی‌شود.",
        });
        return;
    }
    setChatMode(mode);
  }

  const handleSend = async (messageText: string) => {
    if (messageText.trim() === "" || isLoading) return;

    const userMessage: Message = { sender: "user", text: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      if (chatMode === "voice") {
        const result = await voiceChat({ message: messageText });
        const botMessage: Message = { sender: "bot", text: result.text };
        setMessages((prev) => [...prev, botMessage]);

        if (audioRef.current && result.audio) {
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
      const viewport = scrollAreaRef.current.querySelector(
        "div[data-radix-scroll-area-viewport]"
      );
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const timer = setTimeout(() => {
        setMessages([
          {
            sender: "bot",
            text: "سلام! من دستیار هوشمند Trusva هستم. چطور می‌توانم به شما کمک کنم؟",
          },
        ]);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (chatMode !== 'voice' || !isOpen || !isSpeechSupported) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false; // <<< THIS IS THE FIX
      recognitionRef.current = recognition;
    }

    const recognition = recognitionRef.current;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
          return;
      }
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if(finalTranscript.trim()) {
        handleSend(finalTranscript);
      }
    };
    
    // Start listening if not already speaking
    if (!isSpeaking) {
      try {
        recognition.start();
      } catch(e) {
        // Ignore if already started
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [chatMode, isOpen, isSpeechSupported, isSpeaking]);


  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
        setIsSpeaking(true);
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }
    const handleEnd = () => {
        setIsSpeaking(false);
         if (chatMode === 'voice' && isOpen) {
             try {
                recognitionRef.current?.start();
             } catch(e) {/* ignore */}
         }
    }

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('ended', handleEnd);
    audio.addEventListener('pause', handleEnd);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('ended', handleEnd);
      audio.removeEventListener('pause', handleEnd);
    };
  }, [audioRef, chatMode, isOpen]);


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
                  "h-2 w-2 rounded-full",
                  isSpeaking ? "bg-red-500" : (isListening ? "bg-green-500 animate-pulse" : "bg-muted-foreground")
                )}
              />
              <CardDescription>
                {isSpeaking
                  ? "در حال صحبت..."
                  : isListening
                  ? "در حال گوش دادن..."
                  : "آنلاین"}
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
         <div className="p-1 bg-muted rounded-lg flex items-center">
            <motion.div className="absolute h-8 bg-background rounded-md" 
             style={{ width: 'calc(50% - 4px)' }}
             animate={{ x: chatMode === 'text' ? 2 : 'calc(100% + 2px)' }}
             transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
            <Button variant="ghost" className="flex-1 relative z-10 h-8 text-xs" onClick={() => handleModeChange('text')}>متنی</Button>
            <Button variant="ghost" className="flex-1 relative z-10 h-8 text-xs" onClick={() => handleModeChange('voice')}>گفتگوی زنده صوتی</Button>
         </div>
      </div>
      
      <CardContent className="flex-1 p-0 overflow-hidden">
        {chatMode === 'text' ? (
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
        ) : (
            <div className="h-full flex flex-col items-center justify-center gap-4 p-6">
                 <motion.div
                    animate={{
                        scale: isListening ? 1.1 : 1,
                        boxShadow: isListening ? '0 0 20px hsl(var(--primary))' : '0 0 0px hsl(var(--primary))',
                        y: isSpeaking ? [-2, 2, -2] : 0,
                    }}
                    transition={{
                         y: { repeat: Infinity, duration: 0.3, ease: 'easeInOut' },
                         default: { type: 'spring', stiffness: 300, damping: 20 }
                    }}
                    className="w-48 h-48 rounded-full bg-card"
                >
                    <Avatar className="w-full h-full">
                        <AvatarImage src="https://placehold.co/192x192/17192A/FBBF24" alt="AI Assistant" data-ai-hint="robot friendly"/>
                        <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                </motion.div>
                <p className="text-muted-foreground text-center">
                    {isSpeaking ? "..." : (isListening ? "شنیده می‌شود..." : "برای شروع، صحبت کنید.")}
                </p>
                <div className="text-xs text-muted-foreground text-center mt-4">
                  آخرین پیام شما: {messages.filter(m=>m.sender==='user').slice(-1)[0]?.text || "..."}
                </div>
            </div>
        )}
      </CardContent>

      {chatMode === 'text' && (
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
      )}
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

