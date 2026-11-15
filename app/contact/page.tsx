import type { Metadata } from 'next';
import PageHero from '@/components/PageHero';
import { contactGreetings, contactHeroSubtitle, contactHeroTitle } from '@/components/character/luffyLines';
import ContactExperience from '@/components/contact/ContactExperience';
import ReplyTimeLine from '@/components/contact/ReplyTimeLine';
import { getContactConfig } from '@/lib/contact';
import { getLifeStory } from '@/lib/lifeStory';

export const metadata: Metadata = { title: 'Contact — Divyesh Bhavsar' };

/** Contact: a purpose-driven form guided by Luffy (content/contact.json, lib/contact.ts). */
export default function ContactPage() {
  const config = getContactConfig();
  // The address stays split (each part reversed) until "Copy email" is pressed.
  const { linkedin, email } = getLifeStory().contact;

  return (
    <div>
      {/* Luffy greets up here; the chat's own Luffy asks the questions further down. */}
      <PageHero
        title={contactHeroTitle}
        subtitle={contactHeroSubtitle}
        luffy={contactGreetings}
        extras={<ReplyTimeLine replyTime={config.replyTime} />}
      />
      <div className="mx-auto max-w-5xl px-6 pt-8 pb-12 sm:pt-10 sm:pb-16">
        <ContactExperience config={config} linkedin={linkedin} email={email} />
      </div>
    </div>
  );
}
