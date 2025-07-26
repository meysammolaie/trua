
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

interface Message {
  sender: "user" | "bot";
  text: string;
}

interface ChatWidgetProps {
    isEmbedded?: boolean;
}

// Check for SpeechRecognition API
const SpeechRecognition =
  (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition));

export function ChatWidget({ isEmbedded = false }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(isEmbedded);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
      if (isVoiceMode) {
          const result = await voiceChat({ message: messageText });
          const botMessage: Message = { sender: "bot", text: result.text };
          setMessages((prev) => [...prev, botMessage]);
          
          if(audioRef.current) {
            audioRef.current.src = result.audio;
            audioRef.current.play();
            // Start listening again after bot finishes talking
            audioRef.current.onended = () => {
                if (recognitionRef.current && isVoiceMode && isOpen) {
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
  }, [isOpen]);

  // Effect for handling voice recognition logic
  useEffect(() => {
    if (!isVoiceMode || !SpeechRecognition) {
        recognitionRef.current?.stop();
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
        recognition.stop();
        recognitionRef.current = null;
    };
  }, [isVoiceMode, isOpen]); // Rerun when voice mode is toggled or widget opens/closes

  const toggleVoiceMode = () => {
      if(!SpeechRecognition) {
          alert("مرورگر شما از قابلیت تشخیص گفتار پشتیبانی نمی‌کند.");
          return;
      }
      setIsVoiceMode(!isVoiceMode);
  }

  const ChatWindow = (
     <Card className={cn(
        "w-[380px] h-[600px] flex flex-col shadow-2xl transition-all duration-300", 
        isEmbedded && "w-full h-full shadow-none",
        isVoiceMode && "bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900"
        )}>
        <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
                 <div className="relative">
                    <Bot className="w-8 h-8 text-primary" />
                    <AnimatePresence>
                    {isVoiceMode && (
                        <motion.span 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card"
                        />
                    )}
                    </AnimatePresence>
                 </div>
                 <div>
                    <CardTitle>دستیار Trusva</CardTitle>
                    <CardDescription>پشتیبان هوشمند شما</CardDescription>
                </div>
            </div>
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={toggleVoiceMode} title="حالت مکالمه صوتی" disabled={!SpeechRecognition}>
                    <Mic className={cn("h-5 w-5", isVoiceMode && "text-green-400")} />
                </Button>
                {!isEmbedded && (
                    <Button variant="ghost" size="icon" onClick={toggleOpen}>
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </CardHeader>

        {isVoiceMode && (
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center p-4 text-center border-b"
            >
                <motion.div 
                    animate={{ scale: isListening ? [1, 1.2, 1] : 1 }}
                    transition={{ repeat: isListening ? Infinity : 0, duration: 1.5 }}
                >
                    <Mic className={cn("w-16 h-16 text-primary drop-shadow-lg", isListening ? "text-green-400" : "text-primary")}/>
                </motion.div>
                <p className="mt-2 text-sm text-muted-foreground">{isListening ? "در حال گوش دادن..." : "برای صحبت کلیک کنید (بزودی)"}</p>
            </motion.div>
        )}

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
            className="fixed bottom-24 left-4 z-50"
          >
           {ChatWindow}
          </motion.div>
        )}
      </AnimatePresence>
      <Button
        size="icon"
        className="fixed bottom-4 left-4 z-50 rounded-full w-16 h-16 shadow-2xl"
        onClick={toggleOpen}
      >
        <AnimatePresence>
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              exit={{ rotate: 90, scale: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="h-8 w-8" />
            </motion.div>
          ) : (
            <motion.div
              key="bot"
              initial={{ rotate: 90, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              exit={{ rotate: -90, scale: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Bot className="h-8 w-8" />
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
    </>
  );
}
