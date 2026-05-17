import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, 
  Menu, 
  SquarePen, 
  MoreVertical, 
  Plus, 
  Mic, 
  ArrowUp,
  Loader2
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "model";
  parts: [{ text: string }];
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize SpeechRecognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(transcript);
          handleSend(transcript);
        }
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        setIsRecording(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [messages]); // Dependency on messages just to ensure handleSend has fresh closure if needed, 
                   // but actually handleSend uses state setters which are stable. 
                   // Let's refine dependencies below.

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (overrideText?: string) => {
    const messageText = overrideText || input.trim();
    if (!messageText) return;

    const userMessage: Message = {
      role: "user",
      parts: [{ text: messageText }],
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!overrideText) setInput("");
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Failed to start recording:", err);
      }
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-screen bg-black font-sans text-white overflow-hidden selection:bg-slote-green/30">
      {/* Header - Minimal & Dark */}
      <header className="flex items-center justify-between px-6 py-4 bg-transparent z-10">
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/5 transition-colors">
          <Menu className="w-6 h-6" />
        </Button>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={clearChat}
            className="text-white hover:bg-white/5 transition-colors"
          >
            <SquarePen className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/5 transition-colors">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center -mt-20">
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-serif font-normal text-white tracking-tight"
            >
              What can I help with?
            </motion.h2>
          </div>
        ) : (
          <ScrollArea className="h-full px-4 md:px-8 pt-4 pb-32" ref={scrollAreaRef}>
            <div className="max-w-3xl mx-auto space-y-16">
              <AnimatePresence initial={false}>
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className={cn(
                      "flex flex-col w-full",
                      message.role === "user" ? "items-end" : "items-start"
                    )}
                  >
                    {message.role === "user" ? (
                      <div className="bg-[#1a1a1a] px-5 py-3.5 rounded-[22px] max-w-[85%] sm:max-w-[75%] text-white border border-white/5 shadow-sm">
                         <p className="text-[16px] leading-relaxed">{message.parts[0].text}</p>
                      </div>
                    ) : (
                      <div className="w-full text-white max-w-none">
                        <div className="markdown-body text-[16px] leading-[1.65] whitespace-pre-wrap font-sans">
                          <ReactMarkdown>
                            {message.parts[0].text}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              <div ref={messagesEndRef} className="h-8" />
            </div>
          </ScrollArea>
        )}
      </main>

      {/* Input Bar - Capsule Floating */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 md:p-6 pb-8 bg-gradient-to-t from-black via-black/80 to-transparent">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-center bg-[#1a1a1a] border border-white/10 rounded-[32px] px-2 py-2 min-h-[56px] transition-all focus-within:border-[#404040] focus-within:ring-0">
            {/* Attachment Button */}
            <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full text-white hover:bg-white/5 shrink-0">
              <Plus className="w-6 h-6" />
            </Button>

            {/* Input Field */}
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="What's on your mind?"
              className="flex-1 bg-transparent border-none focus:ring-0 text-[16px] text-white px-3 placeholder-ash outline-none"
            />

            {/* Right Side Actions */}
            <div className="flex items-center pr-1 h-9 w-9 justify-center">
              <AnimatePresence mode="wait">
                {input.length > 0 ? (
                  <motion.div
                    key="send"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex items-center justify-center"
                  >
                    <button 
                      onClick={() => handleSend()}
                      className="w-9 h-9 rounded-full bg-slote-green hover:bg-green-deep text-white flex items-center justify-center transition-all active:scale-90 shadow-none border-none outline-none cursor-pointer"
                    >
                      <ArrowUp className="w-5 h-5 stroke-[3px]" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="mic"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex items-center justify-center"
                  >
                    <button 
                      onClick={toggleRecording}
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center transition-colors border-none outline-none cursor-pointer bg-transparent",
                        isRecording 
                          ? "text-red-500 hover:bg-red-500/10" 
                          : "text-ash hover:text-white hover:bg-white/5"
                      )}
                    >
                      {isRecording ? (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                        >
                          <Mic className="w-5 h-5" />
                        </motion.div>
                      ) : (
                        <Mic className="w-5 h-5" />
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

