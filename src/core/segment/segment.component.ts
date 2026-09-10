import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SharedModule } from '../../app/modules/shared.module';
import { EventService } from '../../app/services/event.service';
import { TabBarVisibilityService } from '../../app/services/tab-bar-visibility.service';
import { MessageCircle, UsersRound, CalendarDays, DollarSign, UserRound, Settings, Clock, Palette } from 'lucide-angular';

@Component({
    selector: 'app-segment',
    templateUrl: './segment.component.html',
    styleUrls: ['./segment.component.scss'],
    imports: [SharedModule]
})
export class SegmentComponent implements OnInit {
    readonly MessageCircle =  MessageCircle;
    readonly UsersRound =  UsersRound;
  readonly CalendarDays = CalendarDays;
  readonly DollarSign = DollarSign;
  readonly UserRound = UserRound;
  readonly Settings = Settings;
  readonly Clock = Clock;
  readonly Palette = Palette;

  readonly ajustesButtonId = "openAjustesMenu";

    selectedSegment: string = 'home';
    chatMessages: { sender: string, message: string }[] = [];
    newMessage: string = '';

    constructor(
        //public global: GlobalService,
        private route: ActivatedRoute,
        private router: Router,
        private events: EventService,
        private http: HttpClient,
        public tabBarVisibility: TabBarVisibilityService
    ) {
    }

    ngOnInit() {
        /*
        this.global.getObservable('routerChange').subscribe((res) => {
            if (res) {
                this.onChangeSegment({detail: {value: res}});
            }
        });
        */
        this.getRoute();
    }

    add(){
        this.events.push('add.event', true);
    }

    openSchedule(): void {
        this.events.push('open-schedule-modal', true);
    }

    openTheme(): void {
        this.events.push('open-config-modal', true);
    }

    getRoute() {
        const firstChild = this.route.snapshot.firstChild;
        if (firstChild && firstChild.url.length > 0) {
            this.selectedSegment = firstChild.url[0].path;
        }
    }

    onChangeSegment(value: string) {
        this.selectedSegment = value;
        this.router.navigate([`/tabs/${value}`]);
    }
}
