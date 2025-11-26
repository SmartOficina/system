import { Injectable, ComponentFactoryResolver, ApplicationRef, Injector, EmbeddedViewRef, ComponentRef, Type } from '@angular/core';
import { EventEmitter } from '@angular/core';

export interface ModalOptions {
    data?: any;
    onClose?: () => void;
    backdropClass?: string;
    overlayClass?: string;
    width?: string;
}

export interface ModalComponent {
    closeModal?: () => void;
    closeModalEvent?: EventEmitter<void>;
}

interface ModalElements {
    container: HTMLElement;
    backdrop: HTMLElement;
    content: HTMLElement;
}

@Injectable({
    providedIn: 'root'
})
export class ModalService {
    private modalComponentRefs: Array<ComponentRef<any>> = [];
    private bodyOverflow: string;
    private stylesAdded = false;

    constructor(
        private componentFactoryResolver: ComponentFactoryResolver,
        private appRef: ApplicationRef,
        private injector: Injector
    ) {
        this.bodyOverflow = document.body.style.overflow;
        this.addAnimationStyles();
    }

    private addAnimationStyles(): void {
        if (this.stylesAdded) return;

        const styleElement = document.createElement('style');
        styleElement.innerHTML = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      
      @keyframes slideIn {
        from { 
          opacity: 0;
          transform: translateY(-20px);
        }
        to { 
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes slideOut {
        from { 
          opacity: 1;
          transform: translateY(0);
        }
        to { 
          opacity: 0;
          transform: translateY(20px);
        }
      }
      
      .modal-animate-fadeIn {
        animation: fadeIn 0.2s ease-out forwards;
      }
      
      .modal-animate-fadeOut {
        animation: fadeOut 0.2s ease-in forwards;
      }
      
      .modal-animate-slideIn {
        animation: slideIn 0.3s ease-out forwards;
      }
      
      .modal-animate-slideOut {
        animation: slideOut 0.2s ease-in forwards;
      }
    `;

        document.head.appendChild(styleElement);
        this.stylesAdded = true;
    }

    open<T extends ModalComponent>(component: Type<T>, options: ModalOptions = {}): ComponentRef<T> {
        this.bodyOverflow = document.body.style.overflow;

        document.body.style.overflow = 'hidden';

        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        if (scrollbarWidth > 0) {
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        }

        const modalContainer = document.createElement('div');
        modalContainer.className = 'modal-overlay fixed inset-0 z-50 flex items-center justify-center';
        if (options.overlayClass) {
            modalContainer.className += ' ' + options.overlayClass;
        }

        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fixed inset-0 bg-black bg-opacity-40 transition-opacity modal-animate-fadeIn';
        if (options.backdropClass) {
            backdrop.className += ' ' + options.backdropClass;
        }

        backdrop.addEventListener('click', (event) => {
            if (event.target === backdrop) {
                this.close(componentRef);
                if (options.onClose) {
                    options.onClose();
                }
            }
        });

        const modalContent = document.createElement('div');

        modalContent.className = 'modal-content relative z-10 modal-animate-slideIn bg-white rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto';

        const modalWidth = options.width || 'w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2';
        modalWidth.split(' ').forEach(className => {
            modalContent.classList.add(className);
        });

        modalContent.style.margin = '0 auto';

        const componentFactory = this.componentFactoryResolver.resolveComponentFactory(component);

        const componentRef = componentFactory.create(this.injector);

        if (options.data) {
            Object.assign(componentRef.instance as object, options.data);
        }

        if (componentRef.instance.closeModal) {
            const originalCloseModal = componentRef.instance.closeModal;
            componentRef.instance.closeModal = () => {
                this.close(componentRef);
                if (originalCloseModal) {
                    originalCloseModal.call(componentRef.instance);
                }
                if (options.onClose) {
                    options.onClose();
                }
            };
        }

        if (componentRef.instance.closeModalEvent) {
            componentRef.instance.closeModalEvent.subscribe(() => {
                this.close(componentRef);
                if (options.onClose) {
                    options.onClose();
                }
            });
        }

        this.appRef.attachView(componentRef.hostView);

        const domElem = (componentRef.hostView as EmbeddedViewRef<any>).rootNodes[0] as HTMLElement;

        const conflictingClasses = [
            'bg-white', 'rounded-xl', 'shadow-xl', 'p-6', 'max-h-[90vh]', 'overflow-y-auto',
            'w-11/12', 'md:w-3/4', 'lg:w-2/3', 'xl:w-1/2'
        ];

        conflictingClasses.forEach(className => {
            if (domElem.classList.contains(className)) {
                domElem.classList.remove(className);
            }
        });

        modalContent.appendChild(domElem);

        modalContainer.appendChild(backdrop);
        modalContainer.appendChild(modalContent);
        document.body.appendChild(modalContainer);

        const modalComponentRef = componentRef as unknown as ComponentRef<T> & { modalElements?: ModalElements };
        modalComponentRef.modalElements = {
            container: modalContainer,
            backdrop: backdrop,
            content: modalContent
        };

        this.modalComponentRefs.push(componentRef);

        return componentRef;
    }

    close<T extends ModalComponent>(componentRef: ComponentRef<T>): void {
        const index = this.modalComponentRefs.indexOf(componentRef);

        if (index > -1) {
            this.modalComponentRefs.splice(index, 1);

            const modalComponentRef = componentRef as unknown as ComponentRef<T> & { modalElements?: ModalElements };
            const elements = modalComponentRef.modalElements;

            if (elements) {
                elements.content.classList.remove('modal-animate-slideIn');
                elements.backdrop.classList.remove('modal-animate-fadeIn');

                elements.content.classList.add('modal-animate-slideOut');
                elements.backdrop.classList.add('modal-animate-fadeOut');

                setTimeout(() => {
                    this.appRef.detachView(componentRef.hostView);

                    componentRef.destroy();

                    if (elements.container && elements.container.parentNode) {
                        elements.container.parentNode.removeChild(elements.container);
                    }

                    if (this.modalComponentRefs.length === 0) {
                        document.body.style.overflow = this.bodyOverflow;
                        document.body.style.paddingRight = '';
                    }
                }, 200);
            }
        }
    }

    closeAll(): void {
        const modalsCopy = [...this.modalComponentRefs];
        modalsCopy.forEach(modal => this.close(modal));
    }
}