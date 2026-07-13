import { create } from "zustand";
import { db } from "@/src/lib/db";
import {
  type Settings,
  type TaxPreset,
  type NoteTemplate,
  type TermsTemplate,
  type NumberingConfig,
  type Theme,
  type NumberFormat,
  type CompanyInfo,
  type DocumentType,
  type Template,
  getDefaultNumberingConfig,
  defaultCurrencies,
  defaultPaymentMethods,
  DOCUMENT_TYPES,
} from "@/src/types";
import { now } from "@/src/lib/formatters";

interface SettingsState {
  settings: Settings | null;
  loaded: boolean;
  load: () => Promise<void>;
  updateCompany: (company: CompanyInfo) => Promise<void>;
  updateTaxPresets: (presets: TaxPreset[]) => Promise<void>;
  updateCurrencies: (currencies: Settings["currencies"]) => Promise<void>;
  updatePaymentMethods: (methods: Settings["paymentMethods"]) => Promise<void>;
  updateNumbering: (type: DocumentType, config: NumberingConfig) => Promise<void>;
  updateNoteTemplates: (templates: NoteTemplate[]) => Promise<void>;
  updateTermsTemplates: (templates: TermsTemplate[]) => Promise<void>;
  updateSelectedTemplate: (template: Template) => Promise<void>;
  updateTheme: (theme: Theme) => Promise<void>;
  updateNumberFormat: (format: NumberFormat) => Promise<void>;
  updateOnboardingComplete: (complete: boolean) => Promise<void>;
  resetSettings: () => Promise<void>;
}

function createDefaultSettings(): Settings {
  const nowVal = now();
  const numbering: Record<string, NumberingConfig> = {};
  for (const type of DOCUMENT_TYPES) {
    numbering[type] = getDefaultNumberingConfig(type);
  }
  return {
    id: "default",
    company: { logo: "", companyName: "", email: "", website: "", address: "", taxNumber: "", phone: "" },
    taxPresets: [],
    currencies: defaultCurrencies,
    paymentMethods: defaultPaymentMethods,
    numbering,
    noteTemplates: [],
    termsTemplates: [],
    selectedTemplate: "minimal",
    theme: "system",
    numberFormat: "indian",
    onboardingComplete: false,
    updatedAt: nowVal,
  };
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  loaded: false,
  load: async () => {
    const all = await db.settings.getAll();
    let settings = all.find((s) => s.id === "default");
    if (!settings) {
      settings = createDefaultSettings();
      await db.settings.put(settings);
    }
    set({ settings, loaded: true });
  },
  updateCompany: async (company) => {
    const { settings } = get();
    if (!settings) return;
    const updated = { ...settings, company, updatedAt: now() };
    await db.settings.put(updated);
    set({ settings: updated });
  },
  updateTaxPresets: async (taxPresets) => {
    const { settings } = get();
    if (!settings) return;
    const updated = { ...settings, taxPresets, updatedAt: now() };
    await db.settings.put(updated);
    set({ settings: updated });
  },
  updateCurrencies: async (currencies) => {
    const { settings } = get();
    if (!settings) return;
    const updated = { ...settings, currencies, updatedAt: now() };
    await db.settings.put(updated);
    set({ settings: updated });
  },
  updatePaymentMethods: async (paymentMethods) => {
    const { settings } = get();
    if (!settings) return;
    const updated = { ...settings, paymentMethods, updatedAt: now() };
    await db.settings.put(updated);
    set({ settings: updated });
  },
  updateNumbering: async (type, config) => {
    const { settings } = get();
    if (!settings) return;
    const numbering = { ...settings.numbering, [type]: config };
    const updated = { ...settings, numbering, updatedAt: now() };
    await db.settings.put(updated);
    set({ settings: updated });
  },
  updateNoteTemplates: async (noteTemplates) => {
    const { settings } = get();
    if (!settings) return;
    const updated = { ...settings, noteTemplates, updatedAt: now() };
    await db.settings.put(updated);
    set({ settings: updated });
  },
  updateTermsTemplates: async (termsTemplates) => {
    const { settings } = get();
    if (!settings) return;
    const updated = { ...settings, termsTemplates, updatedAt: now() };
    await db.settings.put(updated);
    set({ settings: updated });
  },
  updateSelectedTemplate: async (selectedTemplate) => {
    const { settings } = get();
    if (!settings) return;
    const updated = { ...settings, selectedTemplate, updatedAt: now() };
    await db.settings.put(updated);
    set({ settings: updated });
  },
  updateTheme: async (theme) => {
    const { settings } = get();
    if (!settings) return;
    const updated = { ...settings, theme, updatedAt: now() };
    await db.settings.put(updated);
    set({ settings: updated });
  },
  updateNumberFormat: async (numberFormat) => {
    const { settings } = get();
    if (!settings) return;
    const updated = { ...settings, numberFormat, updatedAt: now() };
    await db.settings.put(updated);
    set({ settings: updated });
  },
  updateOnboardingComplete: async (onboardingComplete) => {
    let { settings } = get();
    if (!settings) {
      await get().load();
      settings = get().settings;
      if (!settings) return;
    }
    const updated = { ...settings, onboardingComplete, updatedAt: now() };
    await db.settings.put(updated);
    set({ settings: updated });
  },
  resetSettings: async () => {
    const settings = createDefaultSettings();
    await db.settings.put(settings);
    set({ settings });
  },
}));
