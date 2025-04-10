import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { LucideAngularModule } from 'lucide-angular';
@NgModule({
  imports: [CommonModule, IonicModule, LucideAngularModule],
  exports: [CommonModule, IonicModule, LucideAngularModule]
})
export class SharedModule {}