// Temporary test component to check if Scout images load
export function ImageTest() {
  return (
    <div style={{ position: 'fixed', top: '10px', right: '10px', zIndex: 9999, background: 'white', padding: '10px', border: '2px solid red' }}>
      <h3>Image Test</h3>
      <div>
        <p>Direct Scout Image:</p>
        <img 
          src="/attached_assets/generated_images/Scout_math_counting_activity_6b76e197.png"
          alt="Scout test"
          style={{ width: '100px', height: '100px', objectFit: 'cover' }}
          onLoad={() => console.log('✅ Direct image loaded successfully!')}
          onError={() => console.log('❌ Direct image failed to load!')}
        />
      </div>
    </div>
  );
}