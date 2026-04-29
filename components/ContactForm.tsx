"use client";

import { useState, FormEvent } from "react";
import emailjs from "@emailjs/browser";
import type { Language } from "@/lib/i18n/lang";
import type { LocalizedText } from "@/lib/content/loadContent";

interface UiContact {
  intro: LocalizedText;
  fields: {
    name: LocalizedText;
    email: LocalizedText;
    subject: LocalizedText;
    message: LocalizedText;
  };
  submit: LocalizedText;
  success: LocalizedText;
  error: LocalizedText;
  sending: LocalizedText;
  validation: {
    required: LocalizedText;
    email: LocalizedText;
  };
}

interface ContactFormProps {
  lang: Language;
  uiContact: UiContact;
}

type FormStatus = "idle" | "sending" | "success" | "error";

export function ContactForm({ lang, uiContact }: ContactFormProps) {
  const [formStatus, setFormStatus] = useState<FormStatus>("idle");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
  }>({});

  const t = uiContact;

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    const requiredMsg = t.validation.required[lang];
    const invalidEmailMsg = t.validation.email[lang];

    if (!name.trim()) newErrors.name = requiredMsg;
    if (!email.trim()) {
      newErrors.email = requiredMsg;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = invalidEmailMsg;
    }
    if (!subject.trim()) newErrors.subject = requiredMsg;
    if (!message.trim()) newErrors.message = requiredMsg;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setFormStatus("sending");
    setErrors({});

    try {
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

      if (!serviceId || !templateId || !publicKey) {
        throw new Error("EmailJS configuration is missing");
      }

      await emailjs.send(
        serviceId,
        templateId,
        {
          from_name: name,
          from_email: email,
          subject: subject,
          message: message,
        },
        publicKey,
      );

      setFormStatus("success");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (error) {
      console.error("EmailJS error:", error);
      setFormStatus("error");
    }
  };

  const inputBaseClass =
    "w-full px-4 py-[0.6rem] border rounded-[6px] text-[0.88rem] max-[720px]:text-[16px] font-instrument-sans text-cv-text bg-white focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_#e8f3ee] transition-all duration-150";
  const inputErrorClass = "border-warm";
  const inputNormalClass = "border-line";
  const disabledClass = "bg-off";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {/* Name Field */}
      <div>
        <label
          htmlFor="name"
          className="block text-[0.82rem] font-medium text-cv-text mb-[0.4rem] font-instrument-sans"
        >
          {t.fields.name[lang]} <span className="text-warm">*</span>
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={formStatus === "sending"}
          className={`${inputBaseClass} ${errors.name ? inputErrorClass : inputNormalClass} ${formStatus === "sending" ? disabledClass : ""}`}
        />
        {errors.name && (
          <p className="text-warm text-[0.78rem] mt-1 font-instrument-sans">
            {errors.name}
          </p>
        )}
      </div>

      {/* Email Field */}
      <div>
        <label
          htmlFor="email"
          className="block text-[0.82rem] font-medium text-cv-text mb-[0.4rem] font-instrument-sans"
        >
          {t.fields.email[lang]} <span className="text-warm">*</span>
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={formStatus === "sending"}
          className={`${inputBaseClass} ${errors.email ? inputErrorClass : inputNormalClass} ${formStatus === "sending" ? disabledClass : ""}`}
        />
        {errors.email && (
          <p className="text-warm text-[0.78rem] mt-1 font-instrument-sans">
            {errors.email}
          </p>
        )}
      </div>

      {/* Subject Field */}
      <div>
        <label
          htmlFor="subject"
          className="block text-[0.82rem] font-medium text-cv-text mb-[0.4rem] font-instrument-sans"
        >
          {t.fields.subject[lang]} <span className="text-warm">*</span>
        </label>
        <input
          type="text"
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={formStatus === "sending"}
          className={`${inputBaseClass} ${errors.subject ? inputErrorClass : inputNormalClass} ${formStatus === "sending" ? disabledClass : ""}`}
        />
        {errors.subject && (
          <p className="text-warm text-[0.78rem] mt-1 font-instrument-sans">
            {errors.subject}
          </p>
        )}
      </div>

      {/* Message Field */}
      <div>
        <label
          htmlFor="message"
          className="block text-[0.82rem] font-medium text-cv-text mb-[0.4rem] font-instrument-sans"
        >
          {t.fields.message[lang]} <span className="text-warm">*</span>
        </label>
        <textarea
          id="message"
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={formStatus === "sending"}
          className={`${inputBaseClass} ${errors.message ? inputErrorClass : inputNormalClass} ${formStatus === "sending" ? disabledClass : ""}`}
        />
        {errors.message && (
          <p className="text-warm text-[0.78rem] mt-1 font-instrument-sans">
            {errors.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={formStatus === "sending"}
        className={`px-6 py-[0.6rem] max-[720px]:w-full max-[720px]:py-[0.8rem] max-[720px]:text-center rounded-[6px] text-[0.85rem] font-medium font-instrument-sans text-white transition-all duration-150 ${
          formStatus === "sending"
            ? "bg-mid cursor-not-allowed"
            : "bg-accent hover:opacity-90"
        }`}
      >
        {formStatus === "sending" ? t.sending[lang] : t.submit[lang]}
      </button>

      {/* Success Message */}
      {formStatus === "success" && (
        <div className="p-4 bg-accent-light border border-accent rounded-[6px] text-accent text-[0.85rem] font-instrument-sans">
          {t.success[lang]}
        </div>
      )}

      {/* Error Message */}
      {formStatus === "error" && (
        <div className="p-4 bg-[#fef2f2] border border-warm rounded-[6px] text-warm text-[0.85rem] font-instrument-sans">
          {t.error[lang]}
        </div>
      )}
    </form>
  );
}
