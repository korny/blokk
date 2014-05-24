#include <stdio.h>
#include <stdlib.h>
#include <float.h>
#include <complex.h>

const double PI = 3.1415926535897932384626433832795;
const double E  = 2.7182818284590452353602874713527;


void SetHSV( double h, double s, double v, unsigned char color[3] ) {
        double r,g,b;
        if(s==0)
                r = g = b = v;
        else {
                if(h==1) h = 0;
                double z = floor(h*6); int i = int(z);
                double f = double(h*6 - z);
                double p = v*(1-s);
                double q = v*(1-s*f);
                double t = v*(1-s*(1-f));
                switch(i){
                        case 0: r=v; g=t; b=p; break;
                        case 1: r=q; g=v; b=p; break;
                        case 2: r=p; g=v; b=t; break;
                        case 3: r=p; g=q; b=v; break;
                        case 4: r=t; g=p; b=v; break;
                        case 5: r=v; g=p; b=q; break;
                }
        }
        int c;
        c = int(256*r); if(c>255) c = 255; color[0] = c;
        c = int(256*g); if(c>255) c = 255; color[1] = c;
        c = int(256*b); if(c>255) c = 255; color[2] = c;
}

complex<double> one = (1,0);
complex<double> twoI = (-2,-1);
complex<double> ii2 = (2,2);

complex<double> fun( complex<double> & c ){
        // return (sqrt(c))*(sqrt(one-c));
        return (c * c - one) * ((c + twoI) * (c + twoI)) / (c * c + ii2);
}

int main(){
        const int dimx = 800; const int dimy = 800;
        const double rmi = -2; const double rma =  2;
        const double imi = -2; const double ima =  2;

        FILE * fp = fopen("complex.ppm","wb");
        fprintf(fp,"P6\n%d %d\n255\n",dimx,dimy);

        int i,j;
        for(j=0;j<dimy;++j){
                double im = ima - (ima-imi)*j/(dimy-1);
                for(i=0;i<dimx;++i){         
                        double re = rma - (rma-rmi)*i/(dimx-1);
                        complex<double> c(re,im);
                        complex<double> v = fun(c);     
                        double a = arg(v);
                        while(a<0) a += 2*PI; a /= 2*PI;
                        double m = abs(v);
                        double ranges = 0;
                        double rangee = 1;
                        while(m>rangee){
                                ranges = rangee;
                                rangee *= E;
                        }
                        double k = (m-ranges)/(rangee-ranges);
                        double sat = k<0.5 ? k*2: 1 - (k-0.5)*2;
                        sat = 1 - pow( (1-sat), 3); sat = 0.4 + sat*0.6;
                        double val = k<0.5 ? k*2: 1 - (k-0.5)*2; val = 1 - val;
                        val = 1 - pow( (1-val), 3); val = 0.6 + val*0.4;
                        static unsigned char color[3];
                        SetHSV(a,sat,val,color);
                        fwrite(color,1,3,fp);
                }
        }
        fclose(fp);
        return 0;
}