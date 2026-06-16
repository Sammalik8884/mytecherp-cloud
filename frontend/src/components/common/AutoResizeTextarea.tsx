import React, { useEffect, useRef } from "react";

interface AutoResizeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    value: string;
}

export const AutoResizeTextarea: React.FC<AutoResizeTextareaProps> = ({ value, className, onChange, ...props }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    };

    useEffect(() => {
        adjustHeight();
    }, [value]);

    return (
        <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
                adjustHeight();
                if (onChange) onChange(e);
            }}
            className={className}
            {...props}
        />
    );
};
