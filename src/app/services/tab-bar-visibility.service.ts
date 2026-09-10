import { Injectable, signal } from "@angular/core";

const TOP_THRESHOLD = 24;
const DIRECTION_THRESHOLD = 8;

@Injectable({
    providedIn: 'root',
})
export class TabBarVisibilityService {
    readonly visible = signal(true);

    private lastScrollTop = 0;

    onScroll(scrollTop: number): void {
        const delta = scrollTop - this.lastScrollTop;
        this.lastScrollTop = scrollTop;

        if (scrollTop <= TOP_THRESHOLD) {
            this.show();
        } else if (delta > DIRECTION_THRESHOLD) {
            this.hide();
        } else if (delta < -DIRECTION_THRESHOLD) {
            this.show();
        }
    }

    show(): void {
        if (!this.visible()) this.visible.set(true);
    }

    hide(): void {
        if (this.visible()) this.visible.set(false);
    }
}
