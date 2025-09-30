import { useEffect, useRef } from "react";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";

interface VirtualKeyboardProps {
  onChange: (value: string) => void;
  onEnter?: () => void;
  value: string;
  type?: "text" | "number";
}

export const VirtualKeyboard = ({ onChange, onEnter, value, type = "text" }: VirtualKeyboardProps) => {
  const keyboardRef = useRef<any>(null);

  useEffect(() => {
    if (keyboardRef.current) {
      keyboardRef.current.setInput(value);
    }
  }, [value]);

  const handleKeyPress = (button: string) => {
    if (button === "{enter}" && onEnter) {
      onEnter();
    }
  };

  const layout = type === "number" ? {
    default: [
      "1 2 3",
      "4 5 6",
      "7 8 9",
      "{bksp} 0 {enter}"
    ]
  } : {
    default: [
      "q w e r t y u i o p",
      "a s d f g h j k l",
      "{shift} z x c v b n m {bksp}",
      "{space} {enter}"
    ],
    shift: [
      "Q W E R T Y U I O P",
      "A S D F G H J K L",
      "{shift} Z X C V B N M {bksp}",
      "{space} {enter}"
    ]
  };

  const display = type === "number" ? {
    "{bksp}": "⌫",
    "{enter}": "OK"
  } : {
    "{bksp}": "⌫",
    "{enter}": "Enter",
    "{shift}": "⇧",
    "{space}": " "
  };

  return (
    <div className="keyboard-container">
      <Keyboard
        keyboardRef={(r) => (keyboardRef.current = r)}
        onChange={onChange}
        onKeyPress={handleKeyPress}
        layout={layout}
        display={display}
        theme="hg-theme-default custom-keyboard"
        buttonTheme={[
          {
            class: "hg-enter",
            buttons: "{enter}"
          }
        ]}
      />
    </div>
  );
};
