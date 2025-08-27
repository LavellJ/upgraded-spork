import campfireHeaderImage from "@assets/2099b094-0d20-474a-9c0c-067c38a47fe7_1756291587519.png";

export function FloatingNavigation() {
  return (
    <header className="fixed top-0 left-1/2 transform -translate-x-1/2 z-50" data-testid="campfire-header">
      <img 
        src={campfireHeaderImage}
        alt="Campfire Learning Trail"
        className="w-auto object-contain"
        style={{
          filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))',
          height: '240px',
          maxWidth: '1200px'
        }}
      />
    </header>
  );
}
