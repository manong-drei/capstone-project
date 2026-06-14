export default function StaffHeroBanner() {
  return (
    <div
      className="ek-hero"
      style={{
        position: "relative",
        width: "100%",
        height: "210px",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url('/assets/login_bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center 30%",
          filter: "brightness(0.52)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, rgba(30,45,107,0.55) 0%, rgba(30,45,107,0.15) 100%)",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0 24px",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontWeight: 800,
            lineHeight: 1.2,
            fontSize: "clamp(20px, 4vw, 28px)",
            color: "#ffffff",
            textShadow: "0 2px 8px rgba(0,0,0,0.4)",
          }}
        >
          Your Health, Schedule.
          <br />
          <span style={{ color: "#93c5fd" }}>No More Long Waits.</span>
        </h1>
        <p
          style={{
            margin: "10px 0 0",
            lineHeight: 1.55,
            fontSize: "clamp(12px, 2vw, 14px)",
            color: "rgba(255,255,255,0.85)",
            maxWidth: "520px",
            textShadow: "0 1px 4px rgba(0,0,0,0.3)",
          }}
        >
          Get your queue number online, check doctor availability, and track your wait time—all from your phone
        </p>
      </div>
    </div>
  );
}
