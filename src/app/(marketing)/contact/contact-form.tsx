"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/inputs";
import { useToast } from "@/components/ui/toast";

const topics = [
  { value: "brand", label: "I want to launch a campaign" },
  { value: "creator", label: "I need help as a creator" },
  { value: "enterprise", label: "Enterprise inquiry" },
  { value: "other", label: "Something else" },
];

export function ContactForm() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("brand");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [sending, setSending] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Tell us your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid email address.";
    if (message.trim().length < 10) next.message = "Give us a little more detail (10+ characters).";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setName("");
      setEmail("");
      setMessage("");
      toast("Message sent. Our team will reply within one business day.", "success");
    }, 800);
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-xl rounded-none border border-line bg-surface p-6 sm:p-8" noValidate>
      <div className="space-y-4">
        <div>
          <Label htmlFor="contact-name">Full name</Label>
          <Input id="contact-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jordan Blake" />
          <FieldError message={errors.name} />
        </div>
        <div>
          <Label htmlFor="contact-email">Work email</Label>
          <Input id="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jordan@company.com" />
          <FieldError message={errors.email} />
        </div>
        <div>
          <Label htmlFor="contact-topic">Topic</Label>
          <Select id="contact-topic" ariaLabel="Topic" options={topics} value={topic} onChange={(e) => setTopic(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="contact-message" hint="Minimum 10 characters">
            Message
          </Label>
          <Textarea
            id="contact-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us about your campaign goals or the issue you are seeing..."
          />
          <FieldError message={errors.message} />
        </div>
        <Button type="submit" size="lg" className="w-full" loading={sending}>
          Send Message
        </Button>
      </div>
    </form>
  );
}
