export interface GlossaryEntry {
  term: string;
  fullName: string;
  fullNameTr: string;
  unitOrFormat: string;
  normalRange: string;
  plainExplanation: string;
  plainExplanationTr: string;
  whyItMatters: string;
  whyItMattersTr: string;
  category: 'Navigation' | 'Life Support' | 'Propulsion & Power' | 'Data & Comms';
}

export const TELEMETRY_GLOSSARY: GlossaryEntry[] = [
  {
    term: 'MET',
    fullName: 'Mission Elapsed Time',
    fullNameTr: 'Görev Başlangıcından İtibaren Geçen Süre',
    unitOrFormat: 'T+HHH:MM:SS.d',
    normalRange: 'Continuous count from launch',
    plainExplanation:
      'A continuous stopwatch started at liftoff. Every sensor packet, burn maneuver, and crew health log is stamped with MET instead of Earth time zones.',
    plainExplanationTr:
      'Fırlatma anından itibaren durmadan sayan görev kronometresidir. Dünya saat dilimleri yerine tüm sensör paketleri ve manevralar bu zaman damgasıyla kaydedilir.',
    whyItMatters:
      'Time zones do not exist in deep space; MET keeps onboard computers and Earth ground teams synchronized on the exact second an event happened.',
    whyItMattersTr:
      'Uzayda saat dilimi yoktur; gemi bilgisayarları ve Dünya yer ekibi bir olayın tam olarak hangi saniyede gerçekleştiğini bu sayede eşleştirir.',
    category: 'Navigation',
  },
  {
    term: 'RTT (Earth Comm Latency)',
    fullName: 'Round-Trip Light-Speed Delay',
    fullNameTr: 'Gidiş-Dönüş Işık Hızı Sinyal Gecikmesi',
    unitOrFormat: '+MM:SS.s RTT',
    normalRange: '2.6s (Luna) – 73m (Jupiter)',
    plainExplanation:
      'The total time it takes a radio signal traveling at the speed of light to leave the spacecraft, reach Earth, and return with an acknowledgment.',
    plainExplanationTr:
      'Işık hızında giden bir radyo sinyalinin uzay aracından Dünya’ya ulaşıp yanıtın geri dönmesi için geçen toplam süredir.',
    whyItMatters:
      'Because radio waves cannot go faster than light, Mission Control cannot joystick the ship in real time; onboard automation must handle emergencies locally.',
    whyItMattersTr:
      'Radyo dalgaları ışıktan hızlı gidemediği için Dünya’dan anlık kontrol yapılamaz; gemi acil durumları kendi içinde yönetmelidir.',
    category: 'Data & Comms',
  },
  {
    term: 'Cabin O₂ Partial (kPa / psi)',
    fullName: 'Oxygen Partial Pressure',
    fullNameTr: 'Kabin Oksijen Kısmi Basıncı',
    unitOrFormat: 'kPa / psi',
    normalRange: '19.5 – 22.5 kPa (2.8 – 3.3 psi)',
    plainExplanation:
      'How much of the cabin air pressure comes specifically from breathable oxygen molecules (at sea level on Earth, oxygen partial pressure is ~21.3 kPa).',
    plainExplanationTr:
      'Kabin içindeki toplam hava basıncının ne kadarının doğrudan solunabilir oksijen moleküllerinden oluştuğunu gösterir (Dünya deniz seviyesinde ~21.3 kPa).',
    whyItMatters:
      'Total pressure alone is not enough—if oxygen drops below 16 kPa while nitrogen stays high, the crew suffers hypoxia even though the cabin feels pressurized.',
    whyItMattersTr:
      'Toplam basınç normal olsa bile oksijen oranı düşerse mürettebat nefes darlığı ve oksijen yetmezliği (hipoksi) yaşar.',
    category: 'Life Support',
  },
  {
    term: 'SpO₂',
    fullName: 'Peripheral Capillary Oxygen Saturation',
    fullNameTr: 'Kandaki Oksijen Doygunluğu',
    unitOrFormat: '% (Percentage)',
    normalRange: '95% – 100%',
    plainExplanation:
      'The percentage of red blood cells currently carrying oxygen through each astronaut’s bloodstream, measured non-invasively by suit sensors.',
    plainExplanationTr:
      'Astronotun kanındaki kırmızı kan hücrelerinin yüzde kaçının oksijen taşıdığını giysi sensörleriyle ölçer.',
    whyItMatters:
      'An early biological warning sign. If cabin scrubbers fail or a suit leaks, SpO₂ drops before the astronaut notices dizziness.',
    whyItMattersTr:
      'Erken biyolojik uyarı işaretidir; hava temizleyiciler arızalanırsa baş dönmesi hissedilmeden önce SpO₂ düşer.',
    category: 'Life Support',
  },
  {
    term: 'ECLSS',
    fullName: 'Environmental Control & Life Support System',
    fullNameTr: 'Çevre Kontrol ve Yaşam Destek Sistemi',
    unitOrFormat: 'CO₂ ppm / H₂O % / O₂',
    normalRange: 'CO₂ < 600 ppm · O₂ 21.3 kPa',
    plainExplanation:
      'The spacecraft’s artificial lungs and kidneys: it generates breathable oxygen, removes toxic exhaled carbon dioxide (CO₂), and recycles moisture and water.',
    plainExplanationTr:
      'Uzay aracının yapay akciğeri ve böbreğidir: oksijen üretir, nefesle verilen zehirli karbondioksiti temizler ve suyu geri dönüştürür.',
    whyItMatters:
      'Without continuous CO₂ scrubbing, exhaled breath builds up to toxic levels in a sealed hull within hours.',
    whyItMattersTr:
      'Karbondioksit sürekli filtrelenmezse kapalı kabin içinde birkaç saat içinde zehirli seviyeye ulaşır.',
    category: 'Life Support',
  },
  {
    term: 'Δv (Delta-v)',
    fullName: 'Change in Velocity Budget',
    fullNameTr: 'Hız Değişimi Bütçesi',
    unitOrFormat: 'm/s (Meters per second)',
    normalRange: 'Maneuver-dependent',
    plainExplanation:
      'How much speed and direction change the spacecraft needs to perform an orbital correction or capture maneuver—essentially the "currency" of spaceflight.',
    plainExplanationTr:
      'Yörünge düzeltmesi veya gezegen yakalama manevrası için hızın ne kadar değiştirilmesi gerektiğini gösteren uzay uçuşu yakıt bütçesidir.',
    whyItMatters:
      'In space there is no friction, so fuel is spent strictly to change velocity (Δv). Running short of Δv means missing an orbit or landing corridor.',
    whyItMattersTr:
      'Uzayda sürtünme olmadığı için yakıt yalnızca hız değişimi (Δv) üretmek için harcanır; bütçe biterse hedef yörünge kaçırılır.',
    category: 'Navigation',
  },
  {
    term: 'Isp Efficiency',
    fullName: 'Specific Impulse Efficiency',
    fullNameTr: 'Özgül İtki Verimliliği',
    unitOrFormat: '% vs Theoretical Model',
    normalRange: '90% – 96%',
    plainExplanation:
      'A measure of how efficiently rocket engines convert propellant mass into forward thrust (analogous to kilometers per liter in a car, but for rockets).',
    plainExplanationTr:
      'Roket motorunun harcadığı yakıt kütlesini ne kadar verimli itiş gücüne dönüştürdüğünü gösterir (roketler için yakıt verimliliği ölçüsü).',
    whyItMatters:
      'Comparing empirical engine Isp against the theoretical model reveals nozzle wear, thermal loss, or fuel-mixture drift early.',
    whyItMattersTr:
      'Gerçek sensör verisini teorik modelle kıyaslamak, nozül aşınmasını veya ısı kaybını erken yakalamayı sağlar.',
    category: 'Propulsion & Power',
  },
  {
    term: 'RCS',
    fullName: 'Reaction Control System',
    fullNameTr: 'Tepki Kontrol Sistemi (Yönelim İticileri)',
    unitOrFormat: 'Pitch / Yaw / Roll (°)',
    normalRange: '< ±0.5° deadband',
    plainExplanation:
      'Small steering thrusters positioned around the hull that rotate the spacecraft to point antennas toward Earth, solar wings toward the Sun, or engines along the burn vector.',
    plainExplanationTr:
      'Gövde çevresindeki küçük manevra iticileridir; antenleri Dünya’ya, güneş panellerini Güneş’e veya motoru manevra yönüne çevirir.',
    whyItMatters:
      'Without aerodynamic air surfaces in space, RCS thrusters are the only way to control orientation.',
    whyItMattersTr:
      'Uzayda hava olmadığı için kanat/dümen çalışmaz; yönelim kontrolünün tek yolu RCS iticileridir.',
    category: 'Propulsion & Power',
  },
  {
    term: 'mSv/h',
    fullName: 'Millisieverts per Hour (Radiation Flux)',
    fullNameTr: 'Saatlik Milisievert (Radyasyon Akısı)',
    unitOrFormat: 'mSv/h',
    normalRange: '0.2 – 0.8 mSv/h nominal',
    plainExplanation:
      'Measures biological ionizing radiation exposure from cosmic rays and solar flares hitting the hull.',
    plainExplanationTr:
      'Güneş patlamalarından ve kozmik ışınlardan gövdeye çarpan iyonize radyasyon şiddetini ölçer.',
    whyItMatters:
      'During solar particle storms, radiation spikes sharply and crew must shelter inside high-density water-shielded compartments.',
    whyItMattersTr:
      'Güneş fırtınalarında değer hızla yükselir ve mürettebatın su tanklarıyla zırhlanmış sığınak bölmelerine geçmesi gerekir.',
    category: 'Life Support',
  },
  {
    term: 'DSN & Ka-Band',
    fullName: 'Deep Space Network · 32 GHz Radio Link',
    fullNameTr: 'Derin Uzay Ağı · Yüksek Frekanslı Radyo Hattı',
    unitOrFormat: 'dB (SNR) · Mbps',
    normalRange: 'SNR > 12 dB · 2–5 Mbps',
    plainExplanation:
      'Earth’s giant dish complexes (Goldstone, Madrid, Canberra) spaced 120° apart around the globe so at least one antenna always faces the spacecraft as Earth rotates.',
    plainExplanationTr:
      'Dünya döndükçe bağlantının kopmaması için ABD, İspanya ve Avustralya’ya 120° arayla kurulmuş dev çanak anten ağıdır.',
    whyItMatters:
      'SNR (Signal-to-Noise Ratio) indicates how cleanly spacecraft telemetry packets rise above cosmic background static.',
    whyItMattersTr:
      'SNR (Sinyal-Gürültü Oranı), verinin uzaydaki arka plan gürültüsünün ne kadar üzerinde ve temiz ulaştığını gösterir.',
    category: 'Data & Comms',
  },
  {
    term: 'SSE Stream (Telemetry Acquisition)',
    fullName: 'Server-Sent Events Downlink Pipeline',
    fullNameTr: 'Gerçek Zamanlı Telemetri Veri Akış Hattı',
    unitOrFormat: 'JSON Frame · 1 Hz',
    normalRange: 'LIVE STREAMING',
    plainExplanation:
      'The software data pipeline (/api/telemetry/stream) that continuously receives sensor readings from the backend bus, parses JSON frames, and updates the HUD without reloading.',
    plainExplanationTr:
      'Sunucudaki sensör verilerini (/api/telemetry/stream) her saniye JSON paketi olarak alıp ekranları sayfa yenilenmeden güncelleyen canlı veri hattıdır.',
    whyItMatters:
      'Separates raw hardware sensor acquisition from display logic so every screen always stays synchronized on one verified telemetry frame.',
    whyItMattersTr:
      'Ham sensör veri alımını arayüzden ayırarak tüm ekranların tek bir doğrulanmış veri çerçevesinde kalmasını sağlar.',
    category: 'Data & Comms',
  },
];
