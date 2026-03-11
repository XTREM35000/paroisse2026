import React from "react";

const paymentLogos = [
  {
    category: "Cartes bancaires",
    logos: [
      { src: "/svg/VISA.svg", alt: "Visa" },
      { src: "/svg/MasterCard.png", alt: "MasterCard" },
    ],
  },
  {
    category: "Mobile Money",
    logos: [
      { src: "/svg/MOOV.svg", alt: "Moov" },
      { src: "/svg/MTN.svg", alt: "MTN" },
      { src: "/svg/ORANGE.svg", alt: "Orange" },
      { src: "/svg/WAVE.svg", alt: "Wave" },
    ],
  },
  {
    category: "Espèces",
    logos: [
      { src: "/svg/espece.png", alt: "Espèces" },
    ],
  },
];


export function PaymentLogosCardsOnly() {
  return (
    <div className="flex flex-col items-center mb-4">
      <div className="flex flex-row gap-4 justify-center items-center">
        <img src="/svg/VISA.svg" alt="Visa" className="h-14 w-auto object-contain" style={{ maxWidth: 96 }} />
        <img src="/svg/MasterCard.png" alt="MasterCard" className="h-14 w-auto object-contain" style={{ maxWidth: 96 }} />
      </div>
    </div>
  );
}

export default function PaymentLogosSection() {
  return (
    <div className="flex flex-col items-center mb-4">
      {paymentLogos.map((group) => (
        <div key={group.category} className="flex flex-col items-center mb-2">
          <span className="text-xs font-semibold mb-1 text-muted-foreground">{group.category}</span>
          <div className="flex flex-row gap-2 sm:gap-3 justify-center items-center">
            {group.logos.map((logo) => (
              <img
                key={logo.alt}
                src={logo.src}
                alt={logo.alt}
                className="h-7 sm:h-8 w-auto object-contain"
                style={{ maxWidth: 48 }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
