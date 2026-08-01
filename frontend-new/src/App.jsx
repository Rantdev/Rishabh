import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Coffee, ShieldCheck, Sparkles, MapPin, Phone, Mail, 
  ChevronRight, CheckCircle2, Lock, Edit3, Trash2, Plus, 
  Users, TrendingUp, X, ArrowUpRight, Check, Utensils, ShieldCheck as ShieldIcon
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { 
  fetchPackages, fetchPackageDetail, fetchMenu, adminLogin, 
  updatePackage, createPackage, deletePackage, 
  createMenuItem, updateMenuItem, deleteMenuItem,
  sendOTP, verifyOTP,
  submitApplication, fetchApplications 
} from "./api";

export default function App() {
  const [packages, setPackages] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminToken, setAdminToken] = useState(localStorage.getItem("chai_admin_token") || "");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState("packages");

  // Edit package state for admin
  const [editingPackage, setEditingPackage] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Edit/Create Menu state for admin
  const [editingMenuItem, setEditingMenuItem] = useState(null);
  const [isEditMenuModalOpen, setIsEditMenuModalOpen] = useState(false);
  const [isCreateMenuModalOpen, setIsCreateMenuModalOpen] = useState(false);

  const [newMenuData, setNewMenuData] = useState({
    name: "",
    category: "Chai",
    price: 30,
    description: "",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
    popular: false
  });

  const [newPkgData, setNewPkgData] = useState({
    id: "",
    name: "",
    price: 99000,
    tagline: "",
    description: "",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1000&q=80",
    badge: "",
    roi_months: "3-5 Months",
    support_level: "Standard Training",
    features: ["Complete Equipment", "Initial Stock"],
    items: [{ id: "1", name: "Brass Chai Boiler", description: "Standard boiler", included: true }]
  });

  // Apply form state for each package directly on the page, including OTP
  const [applyForms, setApplyForms] = useState({
    silver: { full_name: "", email: "", phone: "", city: "", state: "", message: "", otp: "", otpSent: false, verified: false, demoOtpHint: "" },
    gold: { full_name: "", email: "", phone: "", city: "", state: "", message: "", otp: "", otpSent: false, verified: false, demoOtpHint: "" },
    platinum: { full_name: "", email: "", phone: "", city: "", state: "", message: "", otp: "", otpSent: false, verified: false, demoOtpHint: "" }
  });

  useEffect(() => {
    loadData();
    if (adminToken) {
      setIsAdminLoggedIn(true);
      loadApplications(adminToken);
    }
  }, [adminToken]);

  const loadData = async () => {
    const pkgs = await fetchPackages();
    if (pkgs && pkgs.length > 0) setPackages(pkgs);
    const menu = await fetchMenu();
    if (menu && menu.length > 0) setMenuItems(menu);
  };

  const loadApplications = async (token) => {
    try {
      const apps = await fetchApplications(token);
      setApplications(apps);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePackageClick = async (pkgId) => {
    try {
      const detail = await fetchPackageDetail(pkgId);
      setSelectedPackage(detail);
      setIsDetailModalOpen(true);
    } catch (e) {
      toast.error("Could not load package details.");
    }
  };

  const handleAdminLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await adminLogin(adminEmail, adminPassword);
      if (res.success) {
        setAdminToken(res.token);
        localStorage.setItem("chai_admin_token", res.token);
        setIsAdminLoggedIn(true);
        toast.success("Admin Login Successful!");
        loadApplications(res.token);
      }
    } catch (e) {
      toast.error("Invalid credentials. Please use chaimaskabunn@gmail.com / RishabhAndShrawan@20002001");
    }
  };

  const handleAdminLogout = () => {
    setAdminToken("");
    localStorage.removeItem("chai_admin_token");
    setIsAdminLoggedIn(false);
    toast.info("Logged out from Admin");
  };

  const handleSendOTP = async (pkgId) => {
    const form = applyForms[pkgId];
    if (!form.phone || form.phone.length < 10) {
      toast.error("Please enter a valid 10-digit phone number first.");
      return;
    }
    try {
      const res = await sendOTP(form.phone);
      setApplyForms({
        ...applyForms,
        [pkgId]: { ...form, otpSent: true, demoOtpHint: res.demo_otp }
      });
      toast.success(`OTP sent to ${form.phone}. (Demo OTP: ${res.demo_otp})`);
    } catch (e) {
      toast.error("Failed to send OTP. Please try again.");
    }
  };

  const handleVerifyOTP = async (pkgId) => {
    const form = applyForms[pkgId];
    if (!form.otp) {
      toast.error("Please enter the OTP.");
      return;
    }
    try {
      await verifyOTP(form.phone, form.otp);
      setApplyForms({
        ...applyForms,
        [pkgId]: { ...form, verified: true }
      });
      toast.success("Phone number verified successfully!");
    } catch (e) {
      toast.error("Invalid OTP. Please check the demo OTP hint.");
    }
  };

  const handleApplySubmit = async (e, pkg) => {
    e.preventDefault();
    const form = applyForms[pkg.id] || {};
    if (!form.verified) {
      toast.error("Please verify your mobile number with OTP before submitting.");
      return;
    }
    if (!form.full_name || !form.city) {
      toast.error("Please fill in required fields.");
      return;
    }
    try {
      await submitApplication({
        package_id: pkg.id,
        package_name: pkg.name,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        city: form.city,
        state: form.state || "Madhya Pradesh",
        message: form.message
      });
      toast.success(`Application submitted for ${pkg.name}! Our team will contact you within 24 hours.`);
      setApplyForms({
        ...applyForms,
        [pkg.id]: { full_name: "", email: "", phone: "", city: "", state: "", message: "", otp: "", otpSent: false, verified: false, demoOtpHint: "" }
      });
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to submit application.");
    }
  };

  const handleSavePackage = async (e) => {
    e.preventDefault();
    try {
      await updatePackage(editingPackage.id, editingPackage, adminToken);
      toast.success(`Successfully updated ${editingPackage.name}!`);
      setIsEditModalOpen(false);
      loadData();
    } catch (e) {
      toast.error("Failed to update package");
    }
  };

  const handleCreatePackage = async (e) => {
    e.preventDefault();
    try {
      await createPackage(newPkgData, adminToken);
      toast.success("New franchise package created!");
      setIsCreateModalOpen(false);
      loadData();
    } catch (e) {
      toast.error("Failed to create package");
    }
  };

  const handleDeletePkg = async (id) => {
    if (!window.confirm("Are you sure you want to delete this package?")) return;
    try {
      await deletePackage(id, adminToken);
      toast.success("Package deleted");
      loadData();
    } catch (e) {
      toast.error("Failed to delete package");
    }
  };

  const handleCreateMenuItem = async (e) => {
    e.preventDefault();
    try {
      await createMenuItem(newMenuData, adminToken);
      toast.success("Menu item added successfully!");
      setIsCreateMenuModalOpen(false);
      loadData();
    } catch (e) {
      toast.error("Failed to add menu item");
    }
  };

  const handleSaveMenuItem = async (e) => {
    e.preventDefault();
    try {
      await updateMenuItem(editingMenuItem.id, editingMenuItem, adminToken);
      toast.success("Menu item updated successfully!");
      setIsEditMenuModalOpen(false);
      loadData();
    } catch (e) {
      toast.error("Failed to update menu item");
    }
  };

  const handleDeleteMenuItem = async (id) => {
    if (!window.confirm("Are you sure you want to remove this menu item?")) return;
    try {
      await deleteMenuItem(id, adminToken);
      toast.success("Menu item removed");
      loadData();
    } catch (e) {
      toast.error("Failed to remove menu item");
    }
  };

  return (
    <div className="min-h-screen bg-[#120e0b] text-[#f7f3ef] font-sans selection:bg-amber-500 selection:text-black">
      <Toaster position="top-center" richColors />

      {/* HEADER / NAVBAR */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#120e0b]/85 border-b border-amber-500/20 px-4 lg:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-500/50 shadow-lg shadow-amber-500/30 animate-pulse">
            <img 
              src="https://customer-assets-v7afamib.emergentagent.net/job_chai-membership/artifacts/bcjry3k0_image.png" 
              alt="Chai Maska Bun Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-sm lg:text-lg font-bold tracking-wide font-serif chai-gradient-text">
              Chai Maska Bun Amruttulya
            </h1>
            <p className="text-[10px] text-amber-200/70 tracking-widest uppercase">Franchise &amp; Menu Portal</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
          <a href="#packages" className="hover:text-amber-400 transition-colors">Packages</a>
          <a href="#menu" className="hover:text-amber-400 transition-colors">Our Menu</a>
          <a href="#story" className="hover:text-amber-400 transition-colors">Founders</a>
          <a href="#features" className="hover:text-amber-400 transition-colors">Why Us</a>
          <a href="#contact" className="hover:text-amber-400 transition-colors">Contact</a>
        </nav>

        <div className="flex items-center space-x-3">
          {isAdminLoggedIn ? (
            <div className="flex items-center space-x-3">
              <button 
                data-testid="admin-dashboard-btn"
                onClick={() => setIsAdminModalOpen(true)}
                className="bg-amber-500 text-black px-4 py-2 rounded-full font-semibold text-sm hover:bg-amber-400 transition-all flex items-center space-x-2 shadow-lg shadow-amber-500/20"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Panel</span>
              </button>
              <button 
                data-testid="admin-logout-btn"
                onClick={handleAdminLogout}
                className="bg-red-500/20 text-red-300 border border-red-500/30 px-3 py-2 rounded-full text-sm hover:bg-red-500/30 transition-all"
              >
                Logout
              </button>
            </div>
          ) : (
            <button 
              data-testid="open-admin-login-btn"
              onClick={() => setIsAdminModalOpen(true)}
              className="border border-amber-500/40 text-amber-300 px-4 py-2 rounded-full text-sm font-medium hover:bg-amber-500/10 transition-all flex items-center space-x-2"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Admin Login</span>
            </button>
          )}

          <a 
            href="#packages"
            className="bg-gradient-to-r from-amber-500 to-orange-600 text-black px-5 py-2.5 rounded-full font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-amber-500/30 hidden sm:inline-block"
            data-testid="cta-explore-packages"
          >
            Explore Packages
          </a>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden py-20 lg:py-28 px-4 lg:px-12 flex items-center justify-center">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7 space-y-6 text-center lg:text-left"
          >
            <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 px-4 py-1.5 rounded-full text-amber-400 text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>India’s Most Loved Chai &amp; Maska Bun Franchise</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold font-serif tracking-tight leading-tight">
              Brewing <span className="chai-gradient-text">Moments</span> of Happiness.
            </h1>

            <p className="text-base sm:text-lg text-amber-100/80 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Founded by <strong className="text-amber-300">Shrawan Gupta &amp; Rishabh Gupta</strong> from Rewa, Madhya Pradesh. Bring authentic kulhad chai, golden maska buns, and high profitability to your city.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <a 
                href="#packages"
                className="w-full sm:w-auto bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 text-black px-8 py-4 rounded-full font-extrabold text-base hover:shadow-xl hover:shadow-amber-500/30 transition-all flex items-center justify-center space-x-3 group"
                data-testid="hero-view-packages-btn"
              >
                <span>View Packages &amp; Apply</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a 
                href="#menu"
                className="w-full sm:w-auto border border-amber-500/40 text-amber-200 px-8 py-4 rounded-full font-semibold text-base hover:bg-amber-500/10 transition-all text-center flex items-center justify-center space-x-2"
              >
                <Utensils className="w-4 h-4 text-amber-400" />
                <span>View Menu Card</span>
              </a>
            </div>

            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-amber-500/20">
              <div>
                <p className="text-2xl sm:text-3xl font-bold font-serif text-amber-400">100+</p>
                <p className="text-xs text-amber-200/70 mt-1">Successful Outlets</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold font-serif text-amber-400">₹99K</p>
                <p className="text-xs text-amber-200/70 mt-1">Starting Franchise</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold font-serif text-amber-400">100%</p>
                <p className="text-xs text-amber-200/70 mt-1">Operational Support</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 relative flex justify-center"
          >
            <div className="relative mx-auto w-full max-w-sm rounded-3xl p-3 chai-card-gradient chai-glow-amber">
              <div className="relative overflow-hidden rounded-2xl aspect-square flex items-center justify-center bg-black/50 p-6">
                <img 
                  src="https://customer-assets-v7afamib.emergentagent.net/job_chai-membership/artifacts/bcjry3k0_image.png" 
                  alt="Chai Maska Bun Amruttulya Logo"
                  className="w-full h-full object-contain transform hover:scale-105 transition-transform duration-700 filter drop-shadow-2xl"
                />
              </div>
              <div className="p-4 text-center">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">हर घूँट में अपनापन, हर पल खास</span>
                <p className="text-xs text-amber-100/60 mt-1">Official Trademarked Amruttulya Brand</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* MENU SECTION */}
      <section id="menu" className="py-20 px-4 lg:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-block bg-amber-500/10 text-amber-400 px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase border border-amber-500/20">
            Our Delicious Offerings
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold font-serif">
            Explore Our <span className="chai-gradient-text">Signature Menu</span>
          </h2>
          <p className="text-sm sm:text-base text-amber-100/70">
            From our legendary kulhad chai to buttery toasted maska buns and snacks. Admins can update menu items, photos, and prices instantly from the Admin Panel.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {menuItems.map((item) => (
            <div 
              key={item.id}
              className="rounded-2xl overflow-hidden chai-card-gradient border border-amber-500/20 flex flex-col justify-between group hover:border-amber-500/50 transition-all shadow-lg"
              data-testid={`menu-card-${item.id}`}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {item.popular && (
                  <span className="absolute top-3 left-3 bg-amber-500 text-black text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Bestseller
                  </span>
                )}
                <span className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md text-amber-400 font-serif text-lg font-bold px-3 py-1 rounded-xl border border-amber-500/30">
                  ₹{item.price}
                </span>
              </div>

              <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">{item.category}</span>
                  <h3 className="text-base font-bold font-serif text-white mt-0.5">{item.name}</h3>
                  <p className="text-xs text-amber-100/70 mt-1 line-clamp-2">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PACKAGES & OTP APPLICATION SECTION */}
      <section id="packages" className="py-20 px-4 lg:px-12 max-w-7xl mx-auto bg-[#17110e]/60 rounded-3xl border border-amber-500/20 my-12">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-block bg-amber-500/10 text-amber-400 px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase border border-amber-500/20">
            Investment Opportunities
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold font-serif">
            Franchise Packages &amp; <span className="chai-gradient-text">Verified OTP Application</span>
          </h2>
          <p className="text-sm sm:text-base text-amber-100/70">
            Click any package to view detailed inclusions, or fill out the application form with Mobile OTP Verification directly below each package!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {packages.map((pkg, idx) => {
            const formKey = pkg.id;
            const currentForm = applyForms[formKey] || { full_name: "", email: "", phone: "", city: "", state: "", message: "", otp: "", otpSent: false, verified: false, demoOtpHint: "" };

            return (
              <div 
                key={pkg.id}
                className={`relative rounded-3xl p-6 lg:p-7 chai-card-gradient flex flex-col justify-between border ${idx === 1 ? 'border-amber-400/80 chai-glow-gold' : 'border-amber-500/20'} transition-all group`}
                data-testid={`package-card-${pkg.id}`}
              >
                {pkg.badge && (
                  <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-full shadow-lg">
                    {pkg.badge}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="overflow-hidden rounded-2xl aspect-[16/9] mb-4 relative">
                    <img 
                      src={pkg.image} 
                      alt={pkg.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <h3 className="text-2xl font-bold font-serif text-white">{pkg.name}</h3>
                  <p className="text-xs text-amber-200/80">{pkg.description}</p>
                  
                  <div className="py-2 flex items-baseline justify-between">
                    <div>
                      <span className="text-3xl sm:text-4xl font-extrabold font-serif text-amber-400">
                        ₹{Number(pkg.price).toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-amber-200/60 ml-2">Setup Cost</span>
                    </div>
                    <button 
                      onClick={() => handlePackageClick(pkg.id)}
                      className="text-xs text-amber-300 underline hover:text-amber-400 font-semibold flex items-center space-x-1"
                      data-testid={`inspect-pkg-${pkg.id}`}
                    >
                      <span>View Full Details</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1.5 py-2 border-t border-b border-amber-500/20 text-xs text-amber-100/90">
                    <div className="flex justify-between">
                      <span className="text-amber-200/60">Estimated ROI:</span>
                      <span className="font-semibold text-amber-300">{pkg.roi_months}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-200/60">Support:</span>
                      <span className="font-semibold text-amber-300 truncate max-w-[150px]">{pkg.support_level}</span>
                    </div>
                  </div>

                  <ul className="space-y-2 pt-1">
                    {pkg.features && pkg.features.slice(0, 3).map((feat, fidx) => (
                      <li key={fidx} className="flex items-center text-xs text-amber-100/80">
                        <Check className="w-4 h-4 text-amber-400 mr-2 flex-shrink-0" />
                        <span className="truncate">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* APPLY FORM WITH OTP DIRECTLY BELOW EACH PACKAGE */}
                <div className="mt-8 pt-6 border-t border-amber-500/20 space-y-3">
                  <div className="flex items-center space-x-2 text-amber-300">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h4 className="font-bold font-serif text-sm">Apply with OTP for {pkg.name}</h4>
                  </div>

                  <form onSubmit={(e) => handleApplySubmit(e, pkg)} className="space-y-3">
                    <input 
                      type="text" 
                      required
                      value={currentForm.full_name}
                      onChange={(e) => setApplyForms({
                        ...applyForms, 
                        [pkg.id]: { ...currentForm, full_name: e.target.value }
                      })}
                      placeholder="Full Name *"
                      className="w-full bg-black/60 border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                      data-testid={`apply-name-${pkg.id}`}
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="tel" 
                        required
                        disabled={currentForm.verified}
                        value={currentForm.phone}
                        onChange={(e) => setApplyForms({
                          ...applyForms, 
                          [pkg.id]: { ...currentForm, phone: e.target.value }
                        })}
                        placeholder="Mobile No (10 digits) *"
                        className="w-full bg-black/60 border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 disabled:opacity-50"
                        data-testid={`apply-phone-${pkg.id}`}
                      />
                      {!currentForm.verified ? (
                        <button 
                          type="button"
                          onClick={() => handleSendOTP(pkg.id)}
                          className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-3 py-2 rounded-xl text-xs transition-all"
                          data-testid={`send-otp-btn-${pkg.id}`}
                        >
                          {currentForm.otpSent ? "Resend OTP" : "Send OTP"}
                        </button>
                      ) : (
                        <div className="bg-green-500/20 border border-green-500/40 text-green-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </div>
                      )}
                    </div>

                    {currentForm.otpSent && !currentForm.verified && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                        {currentForm.demoOtpHint && (
                          <div className="text-[11px] text-amber-300 bg-black/40 px-2 py-1 rounded border border-amber-500/20">
                            🔑 Demo OTP code for testing: <strong className="text-white">{currentForm.demoOtpHint}</strong>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            maxLength="4"
                            value={currentForm.otp}
                            onChange={(e) => setApplyForms({
                              ...applyForms, 
                              [pkg.id]: { ...currentForm, otp: e.target.value }
                            })}
                            placeholder="Enter 4-digit OTP"
                            className="flex-1 bg-black/60 border border-amber-500/30 rounded-xl px-3 py-1.5 text-xs text-white"
                            data-testid={`otp-input-${pkg.id}`}
                          />
                          <button 
                            type="button"
                            onClick={() => handleVerifyOTP(pkg.id)}
                            className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-1.5 rounded-xl text-xs"
                            data-testid={`verify-otp-btn-${pkg.id}`}
                          >
                            Verify
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="text" 
                        required
                        value={currentForm.city}
                        onChange={(e) => setApplyForms({
                          ...applyForms, 
                          [pkg.id]: { ...currentForm, city: e.target.value }
                        })}
                        placeholder="City *"
                        className="w-full bg-black/60 border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                        data-testid={`apply-city-${pkg.id}`}
                      />
                      <input 
                        type="email" 
                        value={currentForm.email}
                        onChange={(e) => setApplyForms({
                          ...applyForms, 
                          [pkg.id]: { ...currentForm, email: e.target.value }
                        })}
                        placeholder="Email (Optional)"
                        className="w-full bg-black/60 border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                        data-testid={`apply-email-${pkg.id}`}
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={!currentForm.verified}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-black py-2.5 rounded-xl font-extrabold text-xs hover:opacity-90 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-1 mt-2 disabled:opacity-40 disabled:cursor-not-allowed"
                      data-testid={`submit-app-${pkg.id}`}
                    >
                      <span>Submit Application for {pkg.name}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FOUNDERS STORY SECTION WITH UPLOADED PHOTOS */}
      <section id="story" className="py-24 px-4 lg:px-12 bg-[#17110e] border-y border-amber-500/20 relative overflow-hidden">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-block bg-amber-500/10 text-amber-400 px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase border border-amber-500/20">
              The Visionaries
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold font-serif">
              Founders of <span className="chai-gradient-text">Chai Maska Bun Amruttulya</span>
            </h2>
            <p className="text-sm sm:text-base text-amber-100/70">
              Founded by <strong className="text-amber-300">Shrawan Gupta &amp; Rishabh Gupta</strong>, passionate entrepreneurs from Rewa, Madhya Pradesh.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Founder 1 */}
            <div className="rounded-3xl p-6 chai-card-gradient border border-amber-500/30 space-y-4 flex flex-col items-center text-center chai-glow-amber">
              <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden border-4 border-amber-500/60 shadow-2xl">
                <img 
                  src="https://customer-assets-v7afamib.emergentagent.net/job_chai-membership/artifacts/tzhabfod_WhatsApp%20Image%202026-07-26%20at%2012.04.43%20AM.jpeg" 
                  alt="Founder Shrawan Gupta" 
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold font-serif text-white">Shrawan Gupta</h3>
                <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider">Co-Founder &amp; Director</p>
              </div>
              <p className="text-xs text-amber-100/80 leading-relaxed max-w-md">
                Passionate entrepreneur from Rewa, MP, spearheading brand vision, authentic tea formulation, and nationwide franchise expansion.
              </p>
            </div>

            {/* Founder 2 */}
            <div className="rounded-3xl p-6 chai-card-gradient border border-amber-500/30 space-y-4 flex flex-col items-center text-center chai-glow-amber">
              <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden border-4 border-amber-500/60 shadow-2xl">
                <img 
                  src="https://customer-assets-v7afamib.emergentagent.net/job_chai-membership/artifacts/mgpay6bj_WhatsApp%20Image%202026-07-26%20at%2012.15.57%20PM.jpeg" 
                  alt="Founder Rishabh Gupta" 
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold font-serif text-white">Rishabh Gupta</h3>
                <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider">Co-Founder &amp; Operations Head</p>
              </div>
              <p className="text-xs text-amber-100/80 leading-relaxed max-w-md">
                Co-founder from Rewa, MP, dedicated to operational excellence, premium quality control, and creating unforgettable customer experiences.
              </p>
            </div>
          </div>

          <div className="max-w-4xl mx-auto pt-6">
            <blockquote className="p-8 rounded-3xl bg-amber-500/10 border-l-4 border-amber-500 italic text-amber-200/90 text-base sm:text-lg text-center space-y-3">
              <p>&ldquo;Our dream is to make every cup of chai a symbol of warmth, tradition, and togetherness. At Chai Maska Bun Amruttulya, every customer is family.&rdquo;</p>
              <footer className="text-xs font-bold not-italic text-amber-400 uppercase tracking-widest">— Shrawan Gupta &amp; Rishabh Gupta, Founders</footer>
            </blockquote>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section id="features" className="py-20 px-4 lg:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-block bg-amber-500/10 text-amber-400 px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase border border-amber-500/20">
            Franchise Benefits
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold font-serif">
            Why Partner With <span className="chai-gradient-text">Us?</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl chai-card-gradient border border-amber-500/20 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Coffee className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-serif">Proprietary Secret Blend</h3>
            <p className="text-xs text-amber-100/70 leading-relaxed">
              Our signature spice mix and tea leaf formulation give you a competitive edge that keeps customers returning every single day.
            </p>
          </div>

          <div className="p-8 rounded-3xl chai-card-gradient border border-amber-500/20 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-serif">Low Investment &amp; High ROI</h3>
            <p className="text-xs text-amber-100/70 leading-relaxed">
              Packages starting from just ₹99,000 with optimized operating costs and high gross profit margins on tea and snacks.
            </p>
          </div>

          <div className="p-8 rounded-3xl chai-card-gradient border border-amber-500/20 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-serif">End-to-End Training</h3>
            <p className="text-xs text-amber-100/70 leading-relaxed">
              Complete staff training, operational manuals, marketing campaigns, and grand opening assistance directly by the core team.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contact" className="py-16 px-4 lg:px-12 bg-black border-t border-amber-500/20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-bold font-serif chai-gradient-text">Chai Maska Bun Amruttulya</h3>
            <p className="text-xs text-amber-100/70 leading-relaxed">
              &ldquo;We don&apos;t just serve chai—we create moments of connection, comfort, and happiness.&rdquo;
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2 text-xs text-amber-100/80">
              <li><a href="#packages" className="hover:text-amber-400">Franchise Packages</a></li>
              <li><a href="#menu" className="hover:text-amber-400">Our Menu Card</a></li>
              <li><a href="#story" className="hover:text-amber-400">Founders Story</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Contact Founders</h4>
            <ul className="space-y-2 text-xs text-amber-100/80">
              <li className="flex items-center space-x-2"><MapPin className="w-4 h-4 text-amber-400" /><span>Rewa, Madhya Pradesh</span></li>
              <li className="flex items-center space-x-2"><Mail className="w-4 h-4 text-amber-400" /><span>chaimaskabunn@gmail.com</span></li>
              <li className="flex items-center space-x-2"><Phone className="w-4 h-4 text-amber-400" /><span>+91 98765 43210</span></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Admin Access</h4>
            <p className="text-xs text-amber-100/70">
              Authorized franchise admins can login to manage prices, inventory items, menu photos, and view applications.
            </p>
            <button 
              onClick={() => setIsAdminModalOpen(true)}
              className="bg-amber-500/10 border border-amber-500/40 text-amber-300 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-amber-500/20 transition-all"
            >
              Open Admin Portal
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-amber-500/10 text-center text-xs text-amber-200/50">
          © 2026 Chai Maska Bun Amruttulya. Founded by Shrawan Gupta &amp; Rishabh Gupta. All rights reserved.
        </div>
      </footer>

      {/* DETAILED PACKAGE MODAL */}
      <AnimatePresence>
        {isDetailModalOpen && selectedPackage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl chai-card-gradient border border-amber-500/40 rounded-3xl p-6 lg:p-8 max-h-[90vh] overflow-y-auto shadow-2xl"
              data-testid="package-detail-modal"
            >
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 flex items-center justify-center transition-all"
                data-testid="close-detail-modal"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-6">
                <div className="relative rounded-2xl overflow-hidden aspect-[16/9] bg-black/40 p-4 flex items-center justify-center">
                  <img src={selectedPackage.image} alt={selectedPackage.name} className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6">
                    <div>
                      {selectedPackage.badge && (
                        <span className="bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full mb-2 inline-block">
                          {selectedPackage.badge}
                        </span>
                      )}
                      <h2 className="text-3xl font-bold font-serif text-white">{selectedPackage.name}</h2>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 bg-amber-500/5 p-4 rounded-2xl border border-amber-500/20">
                  <div>
                    <span className="text-xs text-amber-200/60 uppercase tracking-wider block">Investment Price</span>
                    <span className="text-3xl font-bold font-serif text-amber-400">
                      ₹{Number(selectedPackage.price).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-amber-200/60 uppercase tracking-wider block">Est. Payback / ROI</span>
                    <span className="text-sm font-bold text-amber-300">{selectedPackage.roi_months}</span>
                  </div>
                  <div>
                    <span className="text-xs text-amber-200/60 uppercase tracking-wider block">Support Level</span>
                    <span className="text-sm font-bold text-amber-300">{selectedPackage.support_level}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold font-serif text-amber-300">Package Overview</h3>
                  <p className="text-sm text-amber-100/80 leading-relaxed">{selectedPackage.description}</p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold font-serif text-amber-300">Included Equipment &amp; Inventory Items</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedPackage.items && selectedPackage.items.map((item) => (
                      <div key={item.id} className="p-3 rounded-xl bg-black/40 border border-amber-500/20 flex items-start space-x-3">
                        <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-white">{item.name}</h4>
                          <p className="text-[11px] text-amber-200/70">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold font-serif text-amber-300">Key Features &amp; Perks</h3>
                  <ul className="space-y-2">
                    {selectedPackage.features && selectedPackage.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center text-xs text-amber-100/90">
                        <Check className="w-4 h-4 text-amber-400 mr-2 flex-shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADMIN MODAL / PANEL */}
      <AnimatePresence>
        {isAdminModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-5xl chai-card-gradient border border-amber-500/40 rounded-3xl p-6 lg:p-8 max-h-[90vh] overflow-y-auto shadow-2xl"
              data-testid="admin-portal-modal"
            >
              <button 
                onClick={() => setIsAdminModalOpen(false)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 flex items-center justify-center transition-all"
                data-testid="close-admin-modal"
              >
                <X className="w-5 h-5" />
              </button>

              {!isAdminLoggedIn ? (
                <div className="max-w-md mx-auto py-8 space-y-6">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold font-serif">Admin Portal Login</h2>
                    <p className="text-xs text-amber-200/70">
                      Manage package prices, menu items with photos, and review franchise requests.
                    </p>
                  </div>

                  <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-amber-200 mb-1">Admin Email</label>
                      <input 
                        type="email"
                        required
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="chaimaskabunn@gmail.com"
                        className="w-full bg-black/60 border border-amber-500/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400"
                        data-testid="admin-email-input"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-amber-200 mb-1">Password</label>
                      <input 
                        type="password"
                        required
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-black/60 border border-amber-500/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400"
                        data-testid="admin-password-input"
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full bg-amber-500 text-black py-3 rounded-xl font-bold text-sm hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
                      data-testid="admin-login-submit-btn"
                    >
                      Login to Admin
                    </button>
                  </form>

                  <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-300/80 space-y-1">
                    <p className="font-bold">Default Admin Credentials:</p>
                    <p>Email: <span className="text-white font-mono">chaimaskabunn@gmail.com</span></p>
                    <p>Password: <span className="text-white font-mono">RishabhAndShrawan@20002001</span></p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-500/20 pb-4">
                    <div>
                      <h2 className="text-2xl font-bold font-serif text-white">Franchise &amp; Menu Admin Dashboard</h2>
                      <p className="text-xs text-amber-200/70">Welcome back, Admin (Shrawan &amp; Rishabh authorized)</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button 
                        onClick={() => setActiveTab("packages")}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "packages" ? 'bg-amber-500 text-black' : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'}`}
                        data-testid="admin-tab-packages"
                      >
                        Packages ({packages.length})
                      </button>
                      <button 
                        onClick={() => setActiveTab("menu")}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "menu" ? 'bg-amber-500 text-black' : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'}`}
                        data-testid="admin-tab-menu"
                      >
                        Menu Items ({menuItems.length})
                      </button>
                      <button 
                        onClick={() => setActiveTab("applications")}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "applications" ? 'bg-amber-500 text-black' : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'}`}
                        data-testid="admin-tab-applications"
                      >
                        Applications ({applications.length})
                      </button>
                    </div>
                  </div>

                  {activeTab === "packages" && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold font-serif text-amber-300">Manage Franchise Packages &amp; Prices</h3>
                        <button 
                          onClick={() => setIsCreateModalOpen(true)}
                          className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-2"
                          data-testid="add-new-package-btn"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add New Package</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {packages.map((pkg) => (
                          <div key={pkg.id} className="p-4 rounded-2xl bg-black/50 border border-amber-500/20 space-y-3">
                            <div className="aspect-[16/9] rounded-xl overflow-hidden bg-black">
                              <img src={pkg.image} alt={pkg.name} className="w-full h-full object-contain" />
                            </div>
                            <h4 className="font-bold text-white text-base">{pkg.name}</h4>
                            <p className="text-amber-400 font-serif text-xl font-extrabold">₹{Number(pkg.price).toLocaleString('en-IN')}</p>
                            <p className="text-xs text-amber-100/70 line-clamp-2">{pkg.description}</p>
                            
                            <div className="flex items-center space-x-2 pt-2 border-t border-amber-500/20">
                              <button 
                                onClick={() => {
                                  setEditingPackage(pkg);
                                  setIsEditModalOpen(true);
                                }}
                                className="flex-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 py-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1"
                                data-testid={`edit-pkg-${pkg.id}`}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit Price / Photo</span>
                              </button>
                              <button 
                                onClick={() => handleDeletePkg(pkg.id)}
                                className="bg-red-500/20 hover:bg-red-500/30 text-red-300 p-2 rounded-xl text-xs"
                                data-testid={`delete-pkg-${pkg.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === "menu" && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold font-serif text-amber-300">Manage Menu Items, Photos &amp; Prices</h3>
                        <button 
                          onClick={() => setIsCreateMenuModalOpen(true)}
                          className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-2"
                          data-testid="add-new-menu-btn"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Menu Item</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {menuItems.map((item) => (
                          <div key={item.id} className="p-3 rounded-2xl bg-black/50 border border-amber-500/20 space-y-2 flex flex-col justify-between">
                            <div className="aspect-[4/3] rounded-xl overflow-hidden relative">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              <span className="absolute bottom-2 right-2 bg-black/80 text-amber-400 text-xs font-bold px-2 py-0.5 rounded-lg">
                                ₹{item.price}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-amber-400 font-semibold uppercase">{item.category}</span>
                              <h4 className="font-bold text-white text-xs truncate">{item.name}</h4>
                            </div>

                            <div className="flex items-center space-x-2 pt-2 border-t border-amber-500/20">
                              <button 
                                onClick={() => {
                                  setEditingMenuItem(item);
                                  setIsEditMenuModalOpen(true);
                                }}
                                className="flex-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1"
                                data-testid={`edit-menu-${item.id}`}
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button 
                                onClick={() => handleDeleteMenuItem(item.id)}
                                className="bg-red-500/20 hover:bg-red-500/30 text-red-300 p-1.5 rounded-lg text-xs"
                                data-testid={`delete-menu-${item.id}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === "applications" && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold font-serif text-amber-300">Submitted Franchise Applications (OTP Verified)</h3>
                      {applications.length === 0 ? (
                        <p className="text-xs text-amber-200/60 py-8 text-center">No franchise applications received yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {applications.map((app) => (
                            <div key={app.id} className="p-4 rounded-2xl bg-black/50 border border-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">{app.package_name}</span>
                                  <span className="text-xs text-amber-200/50">{new Date(app.created_at).toLocaleDateString()}</span>
                                  <span className="bg-green-500/20 text-green-300 text-[10px] font-bold px-2 py-0.5 rounded">OTP Verified</span>
                                </div>
                                <h4 className="text-white font-bold text-sm">{app.full_name} ({app.city}, {app.state})</h4>
                                <p className="text-xs text-amber-200/70">Phone: {app.phone} | Email: {app.email || 'N/A'}</p>
                                {app.message && <p className="text-xs text-amber-100/80 italic bg-amber-500/5 p-2 rounded-lg mt-1">&ldquo;{app.message}&rdquo;</p>}
                              </div>
                              <span className="w-max bg-amber-500 text-black px-3 py-1 rounded-full text-xs font-bold">
                                {app.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT PACKAGE MODAL */}
      <AnimatePresence>
        {isEditModalOpen && editingPackage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xl chai-card-gradient border border-amber-500/40 rounded-3xl p-6 shadow-2xl"
            >
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="absolute top-6 right-6 w-8 h-8 rounded-full bg-amber-500/10 text-amber-300 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-xl font-bold font-serif text-amber-300 mb-4">Edit Package: {editingPackage.name}</h3>

              <form onSubmit={handleSavePackage} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-amber-200 mb-1">Package Name</label>
                  <input 
                    type="text"
                    value={editingPackage.name}
                    onChange={(e) => setEditingPackage({...editingPackage, name: e.target.value})}
                    className="w-full bg-black/60 border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-amber-200 mb-1">Price (₹)</label>
                  <input 
                    type="number"
                    value={editingPackage.price}
                    onChange={(e) => setEditingPackage({...editingPackage, price: Number(e.target.value)})}
                    className="w-full bg-black/60 border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white"
                    data-testid="edit-package-price-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-amber-200 mb-1">Description</label>
                  <textarea 
                    rows="3"
                    value={editingPackage.description}
                    onChange={(e) => setEditingPackage({...editingPackage, description: e.target.value})}
                    className="w-full bg-black/60 border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-amber-200 mb-1">Image URL</label>
                  <input 
                    type="text"
                    value={editingPackage.image}
                    onChange={(e) => setEditingPackage({...editingPackage, image: e.target.value})}
                    className="w-full bg-black/60 border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>

                <div className="pt-4 flex space-x-3">
                  <button 
                    type="submit"
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-black py-3 rounded-xl font-bold text-sm shadow-lg"
                    data-testid="save-package-btn"
                  >
                    Save Changes
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-6 bg-black/50 border border-amber-500/30 text-amber-200 py-3 rounded-xl text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE PACKAGE MODAL */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xl chai-card-gradient border border-amber-500/40 rounded-3xl p-6 shadow-2xl"
            >
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute top-6 right-6 w-8 h-8 rounded-full bg-amber-500/10 text-amber-300 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-xl font-bold font-serif text-amber-300 mb-4">Create New Franchise Package</h3>

              <form onSubmit={handleCreatePackage} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-amber-200 mb-1">Package ID (e.g. titanium)</label>
                  <input 
                    type="text"
                    required
                    value={newPkgData.id}
                    onChange={(e) => setNewPkgData({...newPkgData, id: e.target.value})}
                    placeholder="titanium"
                    className="w-full bg-black/60 border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-200 mb-1">Package Name</label>
                  <input 
                    type="text"
                    required
                    value={newPkgData.name}
                    onChange={(e) => setNewPkgData({...newPkgData, name: e.target.value})}
                    placeholder="Titanium Flagship"
                    className="w-full bg-black/60 border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-200 mb-1">Price (₹)</label>
                  <input 
                    type="number"
                    required
                    value={newPkgData.price}
                    onChange={(e) => setNewPkgData({...newPkgData, price: Number(e.target.value)})}
                    className="w-full bg-black/60 border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-200 mb-1">Description</label>
                  <textarea 
                    rows="2"
                    value={newPkgData.description}
                    onChange={(e) => setNewPkgData({...newPkgData, description: e.target.value})}
                    className="w-full bg-black/60 border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-200 mb-1">Image URL</label>
                  <input 
                    type="text"
                    value={newPkgData.image}
                    onChange={(e) => setNewPkgData({...newPkgData, image: e.target.value})}
                    className="w-full bg-black/60 border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black py-3 rounded-xl font-bold text-sm shadow-lg mt-4"
                >
                  Create Package
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE MENU ITEM MODAL */}
      <AnimatePresence>
        {isCreateMenuModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xl chai-card-gradient border border-amber-500/40 rounded-3xl p-6 shadow-2xl"
            >
              <button 
                onClick={() => setIsCreateMenuModalOpen(false)}
                className="absolute top-6 right-6 w-8 h-8 rounded-full bg-amber-500/10 text-amber-300 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-xl font-bold font-serif text-amber-300 mb-4">Add New Menu Item</h3>

              <form onSubmit={handleCreateMenuItem} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-amber-200 mb-1">Item Name</label>
                  <input 
                    type="text"
                    required
                    value={newMenuData.name}
                    onChange={(e) => setNewMenuData({...newMenuData, name: e.target.value})}
                    placeholder="e.g. Masala Bun"
                    className="w-full bg-black/60 border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-amber-200 mb-1">Category</label>
                    <select 
                      value={newMenuData.category}
                      onChange={(e) => setNewMenuData({...newMenuData, category: e.target.value})}
                      className="w-full bg-black/60 border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white"
                    >
                      <option value="Chai">Chai</option>
                      <option value="Maska Bun">Maska Bun</option>
                      <option value="Snacks">Snacks</option>
                      <option value="Beverages">Beverages</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-200 mb-1">Price (₹)</label>
                    <input 
                      type="number"
                      required
                      value={newMenuData.price}
                      onChange={(e) => setNewMenuData({...newMenuData, price: Number(e.target.value)})}
                      className="w-full bg-black/60 border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-200 mb-1">Description</label>
                  <textarea 
                    rows="2"
                    value={newMenuData.description}
                    onChange={(e) => setNewMenuData({...newMenuData, description: e.target.value})}
                    className="w-full bg-black/60 border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-200 mb-1">Photo URL</label>
                  <input 
                    type="text"
                    value={newMenuData.image}
                    onChange={(e) => setNewMenuData({...newMenuData, image: e.target.value})}
                    className="w-full bg-black/60 border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black py-3 rounded-xl font-bold text-sm shadow-lg mt-4"
                >
                  Add Item to Menu
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT MENU ITEM MODAL */}
      <AnimatePresence>
        {isEditMenuModalOpen && editingMenuItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xl chai-card-gradient border border-amber-500/40 rounded-3xl p-6 shadow-2xl"
            >
              <button 
                onClick={() => setIsEditMenuModalOpen(false)}
                className="absolute top-6 right-6 w-8 h-8 rounded-full bg-amber-500/10 text-amber-300 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-xl font-bold font-serif text-amber-300 mb-4">Edit Menu Item: {editingMenuItem.name}</h3>

              <form onSubmit={handleSaveMenuItem} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-amber-200 mb-1">Item Name</label>
                  <input 
                    type="text"
                    required
                    value={editingMenuItem.name}
                    onChange={(e) => setEditingMenuItem({...editingMenuItem, name: e.target.value})}
                    className="w-full bg-black/60 border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-amber-200 mb-1">Category</label>
                    <input 
                      type="text"
                      value={editingMenuItem.category}
                      onChange={(e) => setEditingMenuItem({...editingMenuItem, category: e.target.value})}
                      className="w-full bg-black/60 border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-200 mb-1">Price (₹)</label>
                    <input 
                      type="number"
                      required
                      value={editingMenuItem.price}
                      onChange={(e) => setEditingMenuItem({...editingMenuItem, price: Number(e.target.value)})}
                      className="w-full bg-black/60 border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-200 mb-1">Description</label>
                  <textarea 
                    rows="2"
                    value={editingMenuItem.description}
                    onChange={(e) => setEditingMenuItem({...editingMenuItem, description: e.target.value})}
                    className="w-full bg-black/60 border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-200 mb-1">Photo URL</label>
                  <input 
                    type="text"
                    value={editingMenuItem.image}
                    onChange={(e) => setEditingMenuItem({...editingMenuItem, image: e.target.value})}
                    className="w-full bg-black/60 border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black py-3 rounded-xl font-bold text-sm shadow-lg mt-4"
                >
                  Save Menu Changes
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}