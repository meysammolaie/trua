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
import { cn } from "@/lib/utils";

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
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const toggleOpen = () => {
    if (!isEmbedded) {
        setIsOpen(!isOpen);
    }
  };

  const handleSend = async () => {
    if (input.trim() === "" || isLoading) return;

    const userMessage: Message = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await chat({ message: input });
      const botMessage: Message = { sender: "bot", text: result.response };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
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

  const ChatWindow = (
     <Card className={cn("w-[350px] h-[500px] flex flex-col shadow-2xl", isEmbedded && "w-full h-full")}>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                دستیار هوشمند Trusva
                </CardTitle>
                <CardDescription>هر سوالی دارید از من بپرسید</CardDescription>
            </div>
            {!isEmbedded && (
                <Button variant="ghost" size="icon" onClick={toggleOpen}>
                <X className="h-4 w-4" />
            </Button>
            )}
        </CardHeader>
        <CardContent className="flex-1 p-0">
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
            handleSend();
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
    </Card>
  )

  if (isEmbedded) {
    return ChatWindow;
  }

  return (
    <>
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
