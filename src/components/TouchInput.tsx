import { useState } from "react";
import { Input } from "@/components/ui/input";
import { VirtualKeyboard } from "./VirtualKeyboard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface TouchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number";
  label?: string;
  className?: string;
}

export const TouchInput = ({ value, onChange, placeholder, type = "text", label, className }: TouchInputProps) => {
  const [showKeyboard, setShowKeyboard] = useState(false);

  return (
    <>
      <div className={className}>
        {label && <label className="mb-2 block text-sm font-medium text-foreground">{label}</label>}
        <Input
          value={value}
          placeholder={placeholder}
          readOnly
          onClick={() => setShowKeyboard(true)}
          className="cursor-pointer text-lg"
        />
      </div>

      <Dialog open={showKeyboard} onOpenChange={setShowKeyboard}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{label || placeholder}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={value}
              readOnly
              className="text-2xl text-center font-semibold"
            />
            <VirtualKeyboard
              value={value}
              onChange={onChange}
              onEnter={() => setShowKeyboard(false)}
              type={type}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
