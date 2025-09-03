# Device Compatibility Matrix & Offline Setup Guide

This guide helps teachers set up LearnOz across different classroom devices for optimal offline learning experiences.

## 🎯 Quick Setup Checklist

1. **📱 Check device compatibility** (see matrix below)
2. **🌐 Connect to WiFi** for initial asset download  
3. **⬇️ Preload biome content** using QA Panel
4. **✅ Test offline mode** by disconnecting WiFi
5. **🔒 Enable projector-safe mode** for presentations

---

## 📱 Device Compatibility Matrix

| Device Type | Memory | Performance | Offline Support | Recommended Setup |
|-------------|---------|-------------|-----------------|-------------------|
| **iPad (iOS 15+)** | ✅ Excellent | ✅ Smooth | ✅ Full | Perfect for classroom use |
| **Chromebook** | ⚠️ Variable | ✅ Good | ✅ Full | Enable PWA mode |
| **High-end Android** | ✅ Good | ✅ Smooth | ✅ Full | Use Chrome browser |
| **Low-end Android** | ⚠️ Limited | ⚠️ Slower | ⚠️ Basic | Limit concurrent features |
| **Desktop/Laptop** | ✅ Excellent | ✅ Fast | ✅ Full | Best for teacher control |

### Memory Guidelines
- **4GB+ RAM**: Full experience with all features
- **2-4GB RAM**: Good experience, some animation reduction
- **<2GB RAM**: Basic experience, aggressive caching limits

---

## 🔧 Device-Specific Setup Instructions

### 📱 iPad Setup
```
1. Open Safari → Navigate to LearnOz
2. Tap Share button → "Add to Home Screen"
3. Launch from home screen (full PWA experience)
4. Go to Settings → Enable "Offline Mode"
5. Use QA Panel → "Preload current biome"
```

**iPad Tips:**
- Safari works best (Chrome has PWA limitations)
- Enable guided access for focused learning
- Battery can last 6+ hours with offline content

### 💻 Chromebook Setup  
```
1. Open Chrome → Navigate to LearnOz
2. Chrome will prompt "Install LearnOz?" → Click Install
3. Launch from app launcher or desktop
4. Open Teacher Panel (T key) → QA tab
5. Preload all needed biomes before class
```

**Chromebook Tips:**
- Install as PWA for best performance
- Use classroom management tools to push app
- Works great with Google Classroom integration

### 🤖 Android Device Setup
```
1. Open Chrome → Navigate to LearnOz  
2. Menu → "Add to Home screen" or "Install app"
3. Check device memory in QA Panel
4. If low memory: Enable "Calm Mode" in settings
5. Preload one biome at a time
```

**Android Tips:**
- **High-end devices (4GB+ RAM)**: Full experience
- **Mid-range devices (2-4GB RAM)**: Enable calm mode
- **Budget devices (<2GB RAM)**: Use basic mode only

---

## 🌐 Offline Mode Setup

### Step 1: Initial Connection
```
✅ Strong WiFi connection required
✅ Complete app installation 
✅ Login with student profile
✅ Open QA Panel (DEV mode only)
```

### Step 2: Content Preloading
```
1. Press 'T' → Teacher Panel
2. Click "📱 QA" tab (development mode)
3. Check "Service Worker Status" = Active
4. Click "Preload [biome] Biome" button
5. Wait for "X assets" counter to increase
6. Repeat for each biome you'll teach
```

### Step 3: Offline Testing
```
1. Disconnect from WiFi
2. Refresh the page 
3. Verify offline banner appears
4. Test lesson navigation
5. Check progress tracking works
6. Reconnect when ready to sync
```

---

## 🎯 Classroom Management Tips

### 🖥️ Projector/Display Setup
```
1. Connect teacher device to projector
2. Press '?' → Help overlay
3. Enable "Projector-Safe Mode"
4. Features activated:
   ✅ Larger fonts (120% boost)
   ✅ Hidden student names (privacy)
   ✅ Reduced animations (cleaner)
   ✅ No confetti/sounds (professional)
```

### 👥 Student Device Setup
```
For 30-device classroom:
1. Set up 5 devices as "templates"
2. Preload all 4 biomes on templates
3. Use device cloning/imaging to replicate
4. Test offline mode on 2-3 devices
5. Have backup devices ready
```

### 🔧 Troubleshooting Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| **Slow loading** | Enable calm mode, preload assets |
| **Memory errors** | Clear browser cache, restart device |
| **Offline not working** | Check service worker status in QA panel |
| **Missing content** | Reconnect WiFi, refresh asset cache |
| **Progress not saving** | Enable cookies/local storage |

---

## 📊 Performance Optimization

### 🚀 Speed Optimizations
```
1. Preload biomes during lunch/breaks
2. Use calm mode on slower devices  
3. Limit to 1-2 concurrent biomes
4. Clear cache weekly (maintenance)
5. Update app monthly (new features)
```

### 🔋 Battery Conservation
```
- Reduce screen brightness to 70%
- Enable device power saving mode
- Close other apps during lessons
- Use airplane mode with WiFi (iOS)
- Charge devices during breaks
```

### 💾 Storage Management
```
Typical storage usage:
• Core app: ~15MB
• Single biome: ~25MB
• All biomes: ~100MB  
• User progress: ~5MB

Minimum free space needed: 200MB
```

---

## 🆘 Emergency Offline Procedures

### If WiFi Goes Down Mid-Lesson:
```
1. Stay calm - offline mode is designed for this
2. Continue with preloaded lessons
3. Progress saves locally automatically
4. Sync will resume when connection returns
5. Use Teacher Panel → Timeline for backup content
```

### If Service Worker Fails:
```
1. Open QA Panel → check SW status
2. If "Error": Refresh page and reinstall
3. If "Installing": Wait 30 seconds  
4. If "Unsupported": Use basic web mode
5. Contact tech support with error details
```

### Device Troubleshooting:
```
Low Memory Warning:
→ Close other apps
→ Enable calm mode
→ Restart device if needed

Cache Corruption:
→ Clear browser data
→ Reinstall PWA
→ Redownload assets

Network Issues:
→ Toggle airplane mode
→ Forget/reconnect WiFi
→ Restart network adapter
```

---

## 🎓 Teacher Training Recommendations

### Quick Training Session (15 mins):
1. **Install & PWA setup** (5 mins)
2. **Offline preload demo** (5 mins)  
3. **Emergency procedures** (5 mins)

### Full Training Session (45 mins):
1. **Complete device setup** (15 mins)
2. **Student management** (15 mins)
3. **Troubleshooting practice** (15 mins)

### Resources:
- **Video tutorials**: Coming soon
- **FAQ document**: Available in Help overlay  
- **Tech support**: Available during school hours
- **Community forum**: Share classroom setups

---

## 📞 Support & Resources

**In-App Help:**
- Press '?' for help overlay
- Teacher Panel → QA tab for device info
- Built-in troubleshooting tips

**External Support:**
- Email: support@learnoz.com.au
- Phone: 1800-LEARNOZ (business hours)
- Community: forum.learnoz.com.au

**Updates:**
- Monthly feature releases
- Quarterly device compatibility updates
- Annual curriculum refresh

---

*Last updated: January 2025*  
*Compatible with: iOS 15+, Android 8+, Chrome 100+, Safari 15+*