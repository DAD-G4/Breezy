// Logo Breezy : l'image de marque (badge Shiba).
// Le fichier doit être déposé dans front/public/breezy-logo.png
export default function BreezyBadge({ className = "w-24 h-24" }) {
  return (
    <img
      src="/breezy-logo.png"
      alt="Breezy"
      className={`${className} object-contain select-none`}
      draggable={false}
    />
  );
}
