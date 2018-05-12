//
// Parameters that control fragment shader behavior. Different scene materials
// will set these flags to true/false for different looks
//

uniform bool useTextureMapping;     // true if basic texture mapping (diffuse) should be used
uniform bool useNormalMapping;      // true if normal mapping should be used
uniform bool useEnvironmentMapping; // true if environment mapping should be used
uniform bool useBlending;           // true if blending via texture mapping should be used
uniform bool useDisneyBRDF;         // true if disney brdf should be used (default: phong)

//
// texture maps
//

uniform sampler2D diffuseTextureSampler;
uniform sampler2D normalTextureSampler;
uniform sampler2D environmentTextureSampler;
uniform sampler2D blendTextureSampler;

//
// lighting environment definition. Scenes may contain directional
// and point light sources, as well as an environment map
//

#define MAX_NUM_LIGHTS 10
uniform int num_directional_lights;
uniform vec3 directional_light_vectors[MAX_NUM_LIGHTS];
uniform int num_point_lights;
uniform vec3 point_light_positions[MAX_NUM_LIGHTS];

//
// material-specific uniforms
//

// specific to pattern generation for the carpaint material
uniform vec3  paint_color;            
uniform float layer_blend_thresh;


// parameters to the Disney BRDF
uniform float metallic;
uniform float subsurface;
uniform float specular;
uniform float roughness;
uniform float specularTint;
uniform float anisotropic;
uniform float sheen;
uniform float sheenTint;
uniform float clearcoat;
uniform float clearcoatGloss;


// values that are varying per fragment (computed by the vertex shader)

varying vec3 position;     // surface position
varying vec3 normal;       // surface normal
varying vec2 texcoord;     // surface texcoord (uv)
varying vec3 dir2camera;   // vector from surface point to camera
varying mat3 tan2world;    // tangent space to world space transform
varying vec3 vertex_diffuse_color; // surface color

#define PI 3.14159265358979323846


//
// The code below is a full implementation of a Disney BDRF that students may enjoy playing around with
// 
// For more detail, see:
//      https://disney-animation.s3.amazonaws.com/library/s2012_pbs_disney_brdf_notes_v2.pdf
//      https://www.disneyanimation.com/technology/brdf.html
//

float sqr(float x) { return x*x; }

float SchlickFresnel(float u)
{
    float m = clamp(1.-u, 0., 1.);
    float m2 = m*m;
    return m2 * m2 * m; // pow(m,5)
}

float GTR1(float NdotH, float a)
{
    if (a >= 1.) return 1./PI;
    float a2 = a*a;
    float t = 1. + (a2 - 1.)*NdotH*NdotH;
    return (a2 - 1.) / (PI * log(a2) * t);
}

float GTR2(float NdotH, float a)
{
    float a2 = a*a;
    float t = 1. + (a2-1.)*NdotH*NdotH;
    return a2 / (PI * t*t);
}

float GTR2_aniso(float NdotH, float HdotX, float HdotY, float ax, float ay)
{
    return 1. / (PI * ax*ay * sqr( sqr(HdotX/ax) + sqr(HdotY/ay) + NdotH*NdotH ));
}

float smithG_GGX(float NdotV, float alphaG)
{
    float a = alphaG*alphaG;
    float b = NdotV*NdotV;
    return 1. / (NdotV + sqrt(a + b - a*b));
}

float smithG_GGX_aniso(float NdotV, float VdotX, float VdotY, float ax, float ay)
{
    return 1. / (NdotV + sqrt( sqr(VdotX*ax) + sqr(VdotY*ay) + sqr(NdotV) ));
}

vec3 mon2lin(vec3 x)
{
    return vec3(pow(x[0], 2.2), pow(x[1], 2.2), pow(x[2], 2.2));
}

//
// Disney_BRDF --
//
// Evaluate Disney BRDF
//
// L -- direction to light
// V -- direction to camera (view direction)
// N -- surface normal at point being shaded
// X and Y are tangent/binormal
//
vec3 Disney_BRDF( vec3 L, vec3 V, vec3 N, vec3 X, vec3 Y, vec3 baseColor)
{
    float NdotL = clamp(dot(N,L), .0001, .9999);
    float NdotV = clamp(dot(N,V), .0001, .9999);

    vec3 H = normalize(L+V);
    float NdotH = clamp(dot(N,H), .0001, .9999);
    float LdotH = clamp(dot(L,H), .0001, .9999);

    vec3 Cdlin = mon2lin(baseColor);
    float Cdlum = .3*Cdlin[0] + .6*Cdlin[1]  + .1*Cdlin[2]; // luminance approx.

    vec3 Ctint = Cdlum > 0. ? Cdlin/Cdlum : vec3(1); // normalize lum. to isolate hue+sat
    vec3 Cspec0 = mix(specular*.08*mix(vec3(1), Ctint, specularTint), Cdlin, metallic);
    vec3 Csheen = mix(vec3(1), Ctint, sheenTint);

    // Diffuse fresnel - go from 1 at normal incidence to .5 at grazing
    // and mix in diffuse retro-reflection based on roughness
    float FL = SchlickFresnel(NdotL), FV = SchlickFresnel(NdotV);
    float Fd90 = 0.5 + 2. * LdotH*LdotH * roughness;
    float Fd = mix(1.0, Fd90, FL) * mix(1.0, Fd90, FV);

    // Based on Hanrahan-Krueger brdf approximation of isotropic bssrdf
    // 1.25 scale is used to (roughly) preserve albedo
    // Fss90 used to "flatten" retroreflection based on roughness
    float Fss90 = LdotH*LdotH*roughness;
    float Fss = mix(1.0, Fss90, FL) * mix(1.0, Fss90, FV);
    float ss = 1.25 * (Fss * (1. / (NdotL + NdotV) - .5) + .5);

    // specular
    float aspect = sqrt(1.-anisotropic*.9);
    float ax = max(.001, sqr(roughness)/aspect);
    float ay = max(.001, sqr(roughness)*aspect);
    float Ds = GTR2_aniso(NdotH, dot(H, X), dot(H, Y), ax, ay);
    float FH = SchlickFresnel(LdotH);
    vec3 Fs = mix(Cspec0, vec3(1), FH);
    float Gs;
    Gs  = smithG_GGX_aniso(NdotL, dot(L, X), dot(L, Y), ax, ay);
    Gs *= smithG_GGX_aniso(NdotV, dot(V, X), dot(V, Y), ax, ay);

    // sheen
    vec3 Fsheen = FH * sheen * Csheen;

    // clearcoat (ior = 1.5 -> F0 = 0.04)
    float Dr = GTR1(NdotH, mix(.1,.001,clearcoatGloss));
    float Fr = mix(.04, 1.0, FH);
    float Gr = smithG_GGX(NdotL, .25) * smithG_GGX(NdotV, .25);

    return ((1./PI) * mix(Fd, ss, subsurface)*Cdlin + Fsheen)
        * (1.-metallic)
        + Gs*Fs*Ds + .25*clearcoat*Gr*Fr*Dr;
}

//
// Phong_BRDF --
//
// Evaluate phong reflectance model according to the give parameters
// L -- direction to light
// V -- direction to camera (view direction)
// N -- surface normal at point being shaded
//
vec3 Phong_BRDF(vec3 L, vec3 V, vec3 N, vec3 diffuse_color, vec3 specular_color, float specular_exponent)
{

    //
    // TODO CS248: PART 1.1: implement diffuse and specular terms of the Phong
    // reflectance model here.
    // 
    return diffuse_color;

}

//
// SampleEnvironmentMap -- returns incoming radiance from specified direction
//
// D -- world space direction (outward from scene) from which to sample radiance
// 
vec3 SampleEnvironmentMap(vec3 D)
{    

     //
     // TODO CS248 PART 2: sample environment map in direction D.  This requires
     // converting D into spherical coordinates where Y is the polar direction
     // (warning: in our scene, theta is angle with Y axis, which differs from
     // typical convention in physics)
     //

     // Tips:
     //
     // (1) See GLSL documentation of acos(x) and atan(x, y)
     //
     // (2) atan() returns an angle in the range -PI to PI, so you'll have to
     //     convert negative values to the range 0 - 2PI
     //
     // (3) How do you convert theta and phi to normalized texture
     //     coordinates in the domain [0,1]^2?

     return vec3(.25, .25, .25);
     
}

//
// Fragment shader main entry point
//
void main(void)
{
    //////////////////////////////////////////////////////////////////////////
	// Phase 1: Pattern generation. Compute parameters to BRDF 
    //////////////////////////////////////////////////////////////////////////
    
	vec3 diffuseColor = vec3(1.0);
    vec3 specularColor = vec3(1.0);
    float specularExponent = 20.;

    if (useTextureMapping) {
        diffuseColor = texture2D(diffuseTextureSampler, texcoord).rgb;
    } else {
        diffuseColor = vertex_diffuse_color;
    }

    if (useBlending) {

        // TODO CS248: PART 1.2: compute diffuseColor and specularColor based on
        // the value of layer_blend_thresh.

        diffuseColor = paint_color;
        
    }


    /////////////////////////////////////////////////////////////////////////
    // Phase 2: Evaluate lighting and surface BRDF 
    /////////////////////////////////////////////////////////////////////////


    // perform normal map lookup if required
    vec3 N = vec3(0);
    if (useNormalMapping) {

       // TODO: CS248 PART 3: use tan2World in the normal map to compute the
       // world space normal baaed on the normal map.

       // Note that values from the texture should be scaled by 2 and biased
       // by negative -1 to covert positive values from the texture fetch, which
       // lie in the range (0-1), to the range (-1,1).
       //
       // In other words:   tangent_space_normal = texture_value * 2.0 - 1.0;

       // replace this line with your implementation
       N = normalize(normal);
       
    } else {
       N = normalize(normal);
    }

    vec3 V = normalize(dir2camera);
    vec3 color = (useDisneyBRDF) ? vec3(0.0) : vec3(0.1 * diffuseColor);   // ambient term
   
    if (useEnvironmentMapping) {

        //
        // TODO: CS248 PART 2: compute perfect mirror reflection direction here.
        // You'll also need to implement environment map sampling in SampleEnvironmentMap()
        //
        vec3 R = normalize(vec3(1.0));

        color = SampleEnvironmentMap(R);
        gl_FragColor = vec4(color, 1);

        // For now, we'll just assume that any material with environment mapping
        // turned on is a perfect mirror, so there's no need to do further
        // lighting calculations.  Students can change this assumption to combine
        // partial mirror reflection with other bbrdf terms such as diffuse and
        // specular reflectance. 
        return;
    }

    // needed by Disney
    vec3 X = normalize(cross(N, vec3(0, .9999, .0001))); // tangent
    vec3 Y = normalize(cross(N, X)); // bitangent

    float light_mag = 1.0;
    
    // for all directional lights 
    for (int i = 0; i < num_directional_lights; ++i) {
        vec3 L = normalize(-directional_light_vectors[i]);
        vec3 brdf_color = vec3(0);
        if (useDisneyBRDF) {
            brdf_color = 5.0 * Disney_BRDF(L, V, N, X, Y, diffuseColor);
        } else {
            brdf_color = Phong_BRDF(L, V, N, diffuseColor, specularColor, specularExponent);
        }
        color += light_mag * brdf_color;
    }

    // for all point lights
    for (int i = 0; i < num_point_lights; ++i) {
		vec3 light_vector = point_light_positions[i] - position;
        vec3 L = normalize(light_vector);
        float distance = length(light_vector);
        vec3 brdf_color = vec3(0);
        if (useDisneyBRDF) {
            brdf_color = 5.0 * Disney_BRDF(L, V, N, X, Y, diffuseColor);
        } else {
            brdf_color = Phong_BRDF(L, V, N, diffuseColor, specularColor, specularExponent);
        }
        float falloff = 1.0 / (0.01 + distance * distance);
        color += light_mag * falloff * brdf_color;
    }

    gl_FragColor = vec4(color, 1);
}



