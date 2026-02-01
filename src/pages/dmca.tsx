import { Layout } from "@/components/layout/Layout";
import { Mail, FileText, Shield, AlertTriangle } from "lucide-react";

export default function DMCA() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="font-display text-4xl font-bold text-foreground">
              DMCA & Copyright Policy
            </h1>
            <p className="text-xl text-primary font-semibold">BnToon</p>
          </div>

          {/* Introduction */}
          <section className="prose prose-invert max-w-none space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              BnToon respects creativity, intellectual labor, and the dignity of original work. We are fully committed to complying with the Digital Millennium Copyright Act (DMCA) and all applicable international copyright laws.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              BnToon is a non-commercial, community-driven platform created to promote the Bengali (Bangla) language through high-quality fan translations of comics, manhwa, and manhua. Our purpose is cultural preservation, linguistic accessibility, and literary appreciation.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We do not claim ownership of any original artwork, stories, characters, or trademarks. All rights remain with their respective authors, artists, and publishers.
            </p>
            <p className="text-muted-foreground leading-relaxed font-medium">
              Our intention is cultural contribution—not infringement.
            </p>
          </section>

          {/* Copyright Infringement Notice */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <h2 className="font-display text-2xl font-bold text-foreground">
                Copyright Infringement Notice
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              In accordance with the DMCA (17 U.S.C. § 512), BnToon responds promptly to valid copyright infringement notices. If you are a copyright owner or an authorized representative and believe that content hosted on BnToon infringes your rights, please notify us using the procedure outlined below.
            </p>
          </section>

          {/* How to Submit */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-6 w-6 text-primary" />
              <h2 className="font-display text-2xl font-bold text-foreground">
                How to Submit a DMCA Takedown Request
              </h2>
            </div>
            <p className="text-muted-foreground">
              Please send all DMCA-related notices to the following email address:
            </p>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-foreground font-medium">
                📧 Contact Email:{" "}
                <a
                  href="mailto:dmca@bntoon.xyz"
                  className="text-primary hover:underline"
                >
                  dmca@bntoon.xyz
                </a>
              </p>
            </div>

            <p className="text-muted-foreground font-medium mt-6">
              Your notice must include all of the following:
            </p>
            <ul className="space-y-3 text-muted-foreground list-none">
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>Your full legal name and proof of ownership or authorization.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>A clear description of the copyrighted work.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>The exact URL(s) of the allegedly infringing content.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>A statement of good-faith belief that the use is not authorized.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>A statement that the information provided is accurate and made under penalty of perjury.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>Your electronic or physical signature.</span>
              </li>
            </ul>
            <p className="text-amber-500 text-sm font-medium mt-4">
              Incomplete or unverifiable requests may be delayed or disregarded.
            </p>
          </section>

          {/* Content Removal Policy */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-primary" />
              <h2 className="font-display text-2xl font-bold text-foreground">
                Content Removal & Response Policy
              </h2>
            </div>
            <ul className="space-y-3 text-muted-foreground list-none">
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>Content identified in a valid DMCA notice will be removed or disabled promptly.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>Removed content will not be re-uploaded.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>Repeat infringement may result in permanent removal of related content or series.</span>
              </li>
            </ul>
          </section>

          {/* Disclaimer */}
          <section className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h2 className="font-display text-xl font-bold text-foreground">
              Disclaimer & Fair Use Notice
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              BnToon operates under the belief that translation is a transformative act and that content is shared for non-commercial, educational, and cultural purposes only. Fair use is a legal defense, not a guarantee; therefore, we prioritize cooperation with rights holders above all else.
            </p>
          </section>

          {/* Policy Updates */}
          <section className="text-center space-y-2 pt-4 border-t border-border">
            <p className="text-muted-foreground text-sm">
              BnToon reserves the right to update or modify this policy at any time without prior notice.
            </p>
            <p className="text-muted-foreground text-sm font-medium">
              Last Updated: 2026
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
