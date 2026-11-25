
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { SiteSettings } from "@/lib/settings";
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChefHat,
  Coffee,
  Edit3,
  LoaderCircle,
  Menu,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";

type MenuItem = {
  id: number | string;
  name: string;
  price: number | string;
  description: string;
};

type MenuForm = {
  name: string;
  price: string;
  description: string;
};

const emptyForm: MenuForm = {
  name: "",
  price: "",
  description: "",
};

const formatPrice = (value: number | string, currencyLabel: string) => {
  return `${currencyLabel} ${Number(value).toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

async function fetchMenu(signal?: AbortSignal): Promise<MenuItem[]> {
  const response = await fetch("/api/menu", { cache: "no-store", signal });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || "Unable to load the menu.");
  }
  return data.items;
}

export default function MenuHome({ settings, canManage, signedIn, sortOptions }: {
  settings: Omit<SiteSettings, "version">;
  canManage: boolean;
  signedIn: boolean;
  sortOptions: Record<string, string>;
}) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState(settings.default_sort);
  const [mobileMenu, setMobileMenu] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<MenuForm>(emptyForm);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void fetchMenu(controller.signal)
      .then((menu) => {
        if (!controller.signal.aborted) setItems(menu);
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Unable to load the menu.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const filteredItems = useMemo(() => {
    const result = items.filter((item) =>
      `${item.name} ${item.description}`
        .toLowerCase()
        .includes(search.toLowerCase().trim())
    );

    if (sort === "low") {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sort === "high") {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sort === "az") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [items, search, sort]);

  function openAdd() {
    if (loading) return;
    setEditingItem(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  }

  function openEdit(item: MenuItem) {
    setEditingItem(item);
    setForm({
      name: item.name,
      price: String(item.price),
      description: item.description,
    });
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditingItem(null);
    setForm(emptyForm);
    setError("");
  }

  async function saveItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim();
    const description = form.description.trim();
    const price = Number(form.price);

    if (
      !name ||
      !description ||
      form.price.trim() === "" ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      setError("Please complete all fields with a valid price.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const isEditing = Boolean(editingItem);
      const endpoint = isEditing
        ? `/api/menu/${editingItem?.id}`
        : "/api/menu";

      const response = await fetch(endpoint, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          price,
          description,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to save the item.");
      }

      const saved: MenuItem = data.item;
      setItems((current) => isEditing
        ? current.map((item) => String(item.id) === String(saved.id) ? saved : item)
        : [saved, ...current]);
      setModalOpen(false);
      setEditingItem(null);
      setForm(emptyForm);

      setNotice(
        isEditing
          ? "Your menu item has been updated."
          : "A new dish has been added to the menu."
      );

    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(item: MenuItem) {
    const confirmed = window.confirm(
      `Delete "${item.name}" from the menu?`
    );

    if (!confirmed) return;

    setDeletingId(String(item.id));
    setNotice("");
    setError("");

    try {
      const response = await fetch(`/api/menu/${item.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to delete item.");
      }

      setItems((current) =>
        current.filter((entry) => String(entry.id) !== String(item.id))
      );

      setNotice(`"${item.name}" was removed from the menu.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F7F3EA] text-[#302E29]">
      {/* Navigation */}
      <header className="relative z-20 border-b border-[#27382D]/10 bg-[#F7F3EA]">
        <nav className="mx-auto flex h-22 max-w-7xl items-center justify-between px-5 md:px-10">
          <a href="#" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#27382D] text-[#F7F3EA]">
              <UtensilsCrossed size={20} strokeWidth={1.5} />
            </div>

            <div className="leading-tight">
              <span className="block font-display text-[23px] font-semibold tracking-tight">
                {settings.site_name}
              </span>
              <span className="block text-[9px] font-bold uppercase tracking-[0.28em] text-[#817C70]">
                {settings.tagline}
              </span>
            </div>
          </a>

          <div className="hidden items-center gap-9 lg:flex">
            <a href="#home" className="nav-link">Home</a>
            <a href="#story" className="nav-link">Our Story</a>
            <a href="#menu" className="nav-link">The Menu</a>
          </div>

          <div className="hidden items-center gap-4 lg:flex">
            <Link className="nav-link" href={signedIn ? "/account" : "/login"}>{signedIn ? "Account" : "Sign in"}</Link>
            {canManage && <Link className="nav-link" href="/admin">Admin</Link>}
            {canManage && <button onClick={openAdd} disabled={loading} className="account-button"><Plus size={16} /> Add a Dish</button>}
          </div>

          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="rounded-lg p-2 lg:hidden"
            aria-label="Toggle navigation"
            aria-expanded={mobileMenu}
          >
            {mobileMenu ? <X /> : <Menu />}
          </button>
        </nav>

        {mobileMenu && (
          <div className="flex flex-col gap-4 border-t border-[#27382D]/10 px-6 py-5 lg:hidden">
            <a href="#home" onClick={() => setMobileMenu(false)}>Home</a>
            <a href="#story" onClick={() => setMobileMenu(false)}>Our Story</a>
            <a href="#menu" onClick={() => setMobileMenu(false)}>The Menu</a>
            <Link href={signedIn ? "/account" : "/login"}>{signedIn ? "Account" : "Sign in"}</Link>
            {canManage && <Link href="/admin">Admin</Link>}
            {canManage && <button
              disabled={loading}
              onClick={() => {
                setMobileMenu(false);
                openAdd();
              }}
              className="rounded-full bg-[#27382D] px-5 py-3 text-white"
            >
              + Add a Dish
            </button>}
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="home" className="relative overflow-hidden bg-[#27382D] text-[#F7F3EA]">
        <div className="hero-glow pointer-events-none absolute inset-0" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:px-10 md:py-28 lg:py-32">
          <div className="relative z-10">
            <div className="mb-8 flex items-center gap-3">
              <span className="h-px w-9 bg-[#D8BB83]" />
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D8BB83]">
                {settings.copy.heroEyebrow}
              </span>
            </div>

            <h1 className="font-display text-[clamp(4.5rem,8vw,8.4rem)] leading-[0.91] tracking-[-0.055em]">
              {settings.copy.heroHeading}
              <br />
              <span className="italic font-normal text-[#D8BB83]">
                {settings.copy.heroAccent}
              </span>
            </h1>

            <p className="mt-8 max-w-md text-base leading-8 text-[#E1E2D9]/75 md:text-lg">
              {settings.copy.heroBody}
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-6">
              <a
                href="#menu"
                className="inline-flex items-center gap-3 rounded-full bg-[#D8BB83] px-7 py-4 text-sm font-bold text-[#27382D] transition hover:bg-[#F2D49A]"
              >
                Explore Our Menu
                <ArrowRight size={18} />
              </a>

              <a
                href="#story"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#F7F3EA]/80 transition hover:text-white"
              >
                Discover our story
                <ArrowDown size={16} />
              </a>
            </div>
          </div>

          {/* Editorial hero artwork */}
          <div className="relative mx-auto flex aspect-square w-full max-w-[510px] items-center justify-center">
            <div className="hero-orbit absolute h-[95%] w-[95%] rounded-full border border-[#E8D7B4]/20" />
            <div className="hero-orbit absolute h-[79%] w-[79%] rounded-full border border-[#E8D7B4]/15" />

            <div className="plate-shadow relative flex h-[69%] w-[69%] items-center justify-center rounded-full bg-[#E2D4BC] p-[6%]">
              <div className="flex h-full w-full items-center justify-center rounded-full border-[12px] border-[#F2E9D8] bg-[#F9F4E9] shadow-inner">
                <div className="flex h-[72%] w-[72%] flex-col items-center justify-center rounded-full border border-[#D9C9A9] bg-[#F2E6D0] text-center">
                  <Sparkles className="mb-3 text-[#B65C3A]" size={26} strokeWidth={1.4} />
                  <span className="whitespace-pre-line font-display text-[clamp(1.5rem,3.5vw,3rem)] italic leading-tight text-[#27382D]">
                    {settings.copy.plateLabel}
                  </span>
                  <span className="mt-4 text-[9px] font-bold uppercase tracking-[0.3em] text-[#8F7659]">
                    {settings.copy.plateCaption}
                  </span>
                </div>
              </div>
            </div>

            <div className="absolute -left-1 top-[17%] rotate-[-12deg] rounded-full border border-[#D8BB83]/50 bg-[#344939] px-5 py-3 text-xs font-medium tracking-wider text-[#E9D8AE]">
              {settings.copy.freshBadge}
            </div>

            <div className="absolute bottom-[12%] right-0 rotate-[8deg] rounded-full bg-[#B65C3A] px-6 py-4 font-display text-lg italic text-white shadow-xl">
              {settings.copy.greetingBadge}
            </div>
          </div>
        </div>

        <div className="relative border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#E1E2D9]/65 md:px-10">
            <span>{settings.copy.featureOne}</span>
            <span className="hidden h-1 w-1 rounded-full bg-[#D8BB83] sm:block" />
            <span>{settings.copy.featureTwo}</span>
            <span className="hidden h-1 w-1 rounded-full bg-[#D8BB83] sm:block" />
            <span>{settings.copy.featureThree}</span>
          </div>
        </div>
      </section>

      {/* Story */}
      <section
        id="story"
        className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-20 md:grid-cols-[0.8fr_1.2fr] md:gap-20 md:px-10 md:py-28"
      >
        <div>
          <p className="section-eyebrow">{settings.copy.storyEyebrow}</p>
          <h2 className="mt-4 font-display text-5xl leading-[1.08] tracking-tight md:text-6xl">
            {settings.copy.storyHeading}
            <br />
            <span className="italic text-[#B65C3A]">{settings.copy.storyAccent}</span>
          </h2>
        </div>

        <div className="border-l-2 border-[#D8BB83] pl-7 md:pl-10">
          <p className="max-w-2xl font-display text-2xl leading-relaxed text-[#45443B] md:text-3xl">
            {settings.copy.storyBody}
          </p>
          <div className="mt-6 flex items-center gap-3 text-sm font-medium text-[#817C70]">
            <ChefHat size={19} className="text-[#B65C3A]" />
            {settings.copy.storyCaption}
          </div>
        </div>
      </section>

      {/* Menu */}
      <section id="menu" className="bg-[#EEE9DF] py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <div>
              <p className="section-eyebrow">{settings.copy.menuEyebrow}</p>
              <h2 className="mt-4 font-display text-5xl leading-tight tracking-tight md:text-7xl">
                The <span className="italic text-[#B65C3A]">Menu.</span>
              </h2>
              <p className="mt-4 max-w-lg leading-7 text-[#817C70]">
                {settings.menu_intro}
              </p>
            </div>

            {canManage && <button
              onClick={openAdd}
              disabled={loading}
              className="inline-flex items-center gap-3 rounded-full bg-[#27382D] px-6 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#3D5544]"
            >
              <Plus size={18} />
              Add New Dish
            </button>}
          </div>

          {/* Filters */}
          <div className="mt-12 flex flex-col justify-between gap-4 border-y border-[#27382D]/15 py-5 md:flex-row md:items-center">
            <div className="relative w-full md:max-w-sm">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8F897E]"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search dishes"
                placeholder="Search for something delicious..."
                className="w-full rounded-full border border-[#CEC7B9] bg-[#F7F3EA] py-3.5 pl-12 pr-5 text-sm outline-none transition focus:border-[#27382D]"
              />
            </div>

            <div className="flex items-center gap-4">
              <span className="whitespace-nowrap text-sm text-[#817C70]">
                {filteredItems.length} dishes
              </span>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SiteSettings["default_sort"])}
                className="min-w-0 rounded-full border border-[#CEC7B9] bg-[#F7F3EA] px-5 py-3.5 text-sm outline-none focus:border-[#27382D]"
                aria-label="Sort menu"
              >
                {Object.entries(sortOptions).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
          </div>

          {/* Feedback */}
          {notice && (
            <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-[#9BAE91] bg-[#E4EBDF] px-5 py-4 text-sm text-[#27382D]" role="status">
              <span className="flex items-center gap-2">
                <Check size={18} />
                {notice}
              </span>
              <button onClick={() => setNotice("")} aria-label="Dismiss notification">
                <X size={16} />
              </button>
            </div>
          )}

          {error && !modalOpen && (
            <div className="mt-6 rounded-xl border border-[#DDAE9B] bg-[#FAE8E0] px-5 py-4 text-sm text-[#97472D]" role="alert">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-4 text-[#817C70]">
              <LoaderCircle className="animate-spin" size={30} />
              <p className="text-sm">Preparing your menu...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="mt-8 flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-[#C7BFAC] bg-[#F7F3EA]/50 px-6 text-center">
              <Coffee className="mb-5 text-[#B65C3A]" size={36} strokeWidth={1.4} />
              <h3 className="font-display text-3xl">
                {search ? "No matching dishes" : "The menu is waiting"}
              </h3>
              <p className="mt-3 max-w-sm text-sm leading-7 text-[#817C70]">
                {search
                  ? "Try searching for something else."
                  : canManage ? "Add a dish to get started." : "Please check back for new dishes."}
              </p>

              {!search && canManage && (
                <button
                  onClick={openAdd}
                  className="mt-6 rounded-full bg-[#27382D] px-6 py-3 text-sm font-semibold text-white"
                >
                  Add your first dish
                </button>
              )}
            </div>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item, index) => (
                <article
                  key={item.id}
                  className="menu-card group flex min-h-[300px] flex-col rounded-2xl border border-[#DCD5C8] bg-[#F9F6EF] p-7 md:p-8"
                >
                  <div className="mb-8 flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#D9CFBC] text-[#B65C3A] transition group-hover:border-[#B65C3A]">
                      <UtensilsCrossed size={21} strokeWidth={1.4} />
                    </div>

                    <span className="font-display text-lg italic text-[#B8AFA0]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="flex-1">
                    <h3 className="font-display text-[28px] font-semibold leading-[1.15] tracking-tight text-[#27382D]">
                      {item.name}
                    </h3>

                    <p className="mt-3 line-clamp-3 text-sm leading-7 text-[#817C70]">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-8 flex items-end justify-between gap-3 border-t border-[#DDD6C8] pt-6">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[#9B9081]">
                        Price
                      </span>
                      <span className="mt-1 block font-display text-[27px] font-semibold text-[#B65C3A]">
                        {formatPrice(item.price, settings.currency_label)}
                      </span>
                    </div>

                    {canManage && <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(item)}
                        disabled={deletingId === String(item.id)}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D5CDBD] text-[#27382D] transition hover:border-[#27382D] hover:bg-[#27382D] hover:text-white"
                        aria-label={`Edit ${item.name}`}
                        title="Edit dish"
                      >
                        <Edit3 size={16} />
                      </button>

                      <button
                        onClick={() => deleteItem(item)}
                        disabled={deletingId !== null}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D5CDBD] text-[#B65C3A] transition hover:border-[#B65C3A] hover:bg-[#B65C3A] hover:text-white disabled:opacity-50"
                        aria-label={`Delete ${item.name}`}
                        title="Delete dish"
                      >
                        {deletingId === String(item.id) ? (
                          <LoaderCircle className="animate-spin" size={16} />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>}
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="mt-12 flex items-center justify-center gap-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[#9B9081]">
            <span className="h-px w-8 bg-[#B5A58E]" />
            {settings.copy.menuCaption}
            <span className="h-px w-8 bg-[#B5A58E]" />
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="bg-[#B65C3A] px-6 py-20 text-center text-white md:py-28">
        <Sparkles className="mx-auto mb-7 text-[#F5D8BB]" size={26} strokeWidth={1.3} />

        <h2 className="mx-auto max-w-3xl font-display text-5xl leading-[1.1] tracking-tight md:text-7xl">
          {settings.copy.closingHeading}
          <br />
          <span className="italic text-[#F5D8BB]">
            {settings.copy.closingAccent}
          </span>
        </h2>

        <p className="mx-auto mt-6 max-w-md text-base leading-8 text-[#FBEDE4]/85">
          {settings.copy.closingBody}
        </p>

        <a
          href="#menu"
          className="mt-9 inline-flex items-center gap-3 rounded-full bg-[#F7F3EA] px-7 py-4 text-sm font-bold text-[#27382D] transition hover:bg-white"
        >
          Browse the Menu
          <ArrowRight size={17} />
        </a>
      </section>

      {/* Footer */}
      <footer className="bg-[#203026] px-6 py-10 text-[#F7F3EA]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <UtensilsCrossed size={20} className="text-[#D8BB83]" />
            <span className="font-display text-2xl">
              {settings.site_name}
            </span>
          </div>

          <p className="text-center text-xs text-[#E1E2D9]/55">
            {settings.copy.footerNote}
          </p>

          <a
            href="#home"
            className="text-xs font-semibold uppercase tracking-widest text-[#D8BB83]"
          >
            Back to Top ↑
          </a>
        </div>
      </footer>

      {/* Add / Edit Modal */}
      {canManage && modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#17231B]/75 px-4 py-8 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="dish-modal-title"
            className="w-full max-w-lg overflow-y-auto rounded-[22px] bg-[#F7F3EA] p-7 shadow-2xl sm:p-10"
            style={{ maxHeight: "calc(100vh - 40px)" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-eyebrow">
                  {editingItem ? "Refine your menu" : "Something delicious"}
                </p>

                <h2
                  id="dish-modal-title"
                  className="mt-3 font-display text-4xl tracking-tight text-[#27382D]"
                >
                  {editingItem ? "Edit Dish" : "Add a Dish"}
                  <span className="text-[#B65C3A]">.</span>
                </h2>
              </div>

              <button
                onClick={closeModal}
                aria-label="Close form"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#D5CDBD] text-[#27382D] hover:bg-[#E9E1D4]"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-[#817C70]">
              {editingItem
                ? "Update the details of this delicious creation."
                : "Give your creation a name, a price, and a little description."}
            </p>

            <form onSubmit={saveItem} className="mt-8 space-y-5">
              <div>
                <label htmlFor="dish-name" className="form-label">
                  Dish Name
                </label>
                <input
                  id="dish-name"
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="e.g. Creamy Truffle Pasta"
                  maxLength={150}
                  required
                  className="form-input"
                />
              </div>

              <div>
                <label htmlFor="dish-price" className="form-label">
                  Price ({settings.currency_code})
                </label>
                <input
                  id="dish-price"
                  type="number"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: e.target.value })
                  }
                  placeholder="e.g. 1850"
                  min="0"
                  max="99999999.99"
                  step="0.01"
                  required
                  className="form-input"
                />
              </div>

              <div>
                <label htmlFor="dish-description" className="form-label">
                  Description
                </label>
                <textarea
                  id="dish-description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Describe the ingredients and flavours..."
                  rows={4}
                  required
                  className="form-input resize-none"
                />
              </div>

              {error && (
                <div className="rounded-xl bg-[#F8E2D9] px-4 py-3 text-sm text-[#97472D]" role="alert">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="flex-1 rounded-full border border-[#CFC7B9] px-5 py-4 text-sm font-semibold text-[#27382D] transition hover:bg-[#EAE4D9] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex flex-[1.6] items-center justify-center gap-2 rounded-full bg-[#27382D] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#3D5544] disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <LoaderCircle size={17} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      {editingItem ? <Check size={17} /> : <Plus size={17} />}
                      {editingItem ? "Save Changes" : "Add to Menu"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
