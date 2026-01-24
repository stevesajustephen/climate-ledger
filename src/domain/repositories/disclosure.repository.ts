import { Disclosure } from "../entities/disclosure.entity";

export interface DisclosureRepository {
  save(disclosure: Disclosure): Promise<void>;
  getBySlug(slug: string): Promise<Disclosure | null>;
}
