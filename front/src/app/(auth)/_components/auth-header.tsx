"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface AuthHeaderProps {
  title: string;
  description: string;
  backUrl?: string;
  backLabel?: string;
}

/**
 * AuthHeader
 * 
 * Renderiza el título principal, la descripción y un botón opcional para volver atrás.
 * Todos los elementos internos utilizan la clase "form-element" para ser animados
 * automáticamente por el AuthFormWrapper.
 */
export function AuthHeader({ 
  title, 
  description, 
  backUrl, 
  backLabel = "Volver" 
}: AuthHeaderProps) {
  const router = useRouter();

  return (
    <div className="form-element mb-8 relative">
      {backUrl && (
        <button
          type="button"
          onClick={() => router.push(backUrl)}
          className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          {backLabel}
        </button>
      )}
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
        {title}
      </h2>
      <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
        {description}
      </p>
    </div>
  );
}
