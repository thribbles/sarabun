import React from "react";

interface GarudaProps {
  /** ขนาดความสูง เช่น 3cm (หนังสือภายนอก) หรือ 1.5cm (บันทึกข้อความ) */
  size?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * ตราครุฑราชการไทยแท้ (Official Thai Royal Garuda Emblem)
 * สกัดจากไฟล์ต้นแบบราชการ (in01.pdf และ 03.pdf ระเบียบสำนักนายกรัฐมนตรี)
 * - หนังสือภายนอก: ขนาดความสูง 3.0 ซม. (3cm)
 * - บันทึกข้อความ: ขนาดความสูง 1.5 ซม. (1.5cm)
 */
export const GarudaCrest: React.FC<GarudaProps> = ({
  size = "3cm",
  className = "",
  style = {},
}) => {
  return (
    <img
      src="/garuda.png"
      alt="ตราครุฑราชการ"
      className={`garuda-img ${className}`}
      style={{
        height: size,
        width: "auto",
        display: "inline-block",
        verticalAlign: "middle",
        imageRendering: "auto",
        ...style,
      }}
    />
  );
};
