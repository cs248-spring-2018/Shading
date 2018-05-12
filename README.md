# Stanford CS248 Assignment 3: Real-Time Shader Programming

The repository is located at https://github.com/cs248-spring-2018/Shading.

## Due date

The assignment is due Sun May 20th at 11:59:59 PM.

## Summary

In this assignment, you are a given a simple real-time renderer and a few 3D scenes.  However, the starter code implements only very simple material and lighting models, so rendered images do not look particularly great. In this assignment, you will improve the quality of the rendering by implementing a number of lighting and material shading effects using the GLSL, OpenGL's [shading language](https://thebookofshaders.com/01/).  The point of this assignment is to get basic experience with modern shader programming, and to build understanding of how material pattern logic, material BRDFs, and lighting computations are combined in a shader to compute surface reflectance.  Compared to assignments 1 and 2, this is a relatively short assignment, but there are countless ways you can keep going by adding more complex materials and lighting.  We're interested to see what you can do!

## Build Instructions

In order to ease the process of running on different platforms, we will be using [CMake](http://www.cmake.org/) for our assignments. You will need a CMake installation of version 2.8+ to build the code for this assignment. It should also be relatively easy to build the assignment and work locally on your OSX or 64-bit version of Linux or Windows.
The project can be run by SSH'ing to rice.stanford.edu with your SUNet ID, password, and two-step authentication using MobaXterm (remember to turn on X11 forwarding). If you choose to do so, you can skip over to the next step.

### OS X/Linux Build Instructions

If you are working on OS X and do not have CMake installed, we recommend installing it through [Homebrew](http://brew.sh/): `$ brew install cmake`.  You may also need the freetype package `$ brew install freetype`.

If you are working on Linux, you should be able to install dependencies with your system's package manager as needed (you may need cmake and freetype, and possibly others).

#### To install freetype on Linux:

```
$ sudo apt-get install libfreetype6
$ sudo apt-get install libfreetype6-dev
```

#### To install other possible dependencies (RandR, etc) on Linux:

```
$ sudo apt-get install libglu1-mesa-dev
$ sudo apt-get install xorg-dev
```

#### To build your code for this assignment on OS X or Linux:

```
$ cd Render && mkdir build && cd build
$ cmake ..
$ make
```

These 3 steps (1) create an out-of-source build directory, (2) configure the project using CMake, and (3) compile the project. If all goes well, you should see an executable `render` in the build directory. As you work, simply typing `make` in the build directory will recompile the project.

### Windows Build Instructions

You need to install the latest version of [CMake](http://www.cmake.org/) and [Visual Studio](https://www.visualstudio.com/). Visual Studio Community is free. After installing these programs, replace `SOURCE_DIR` to the cloned directory (`Render/` in our case), and `BUILD_DIR` to `SOURCE_DIR/build`.

![Sample locations](misc/cmake_initial_setup.png?raw=true)

Then, press `Configure` button, select proper version of Visual Studio (**You should probably select Win64**), and you should see `Configuring done` message. Then, press `Generate` button and you should see `Generating done`.

![Sample locations](misc/cmake_final_setup.png?raw=true)

This should create a `build` directory with a Visual Studio solution file in it named `render.sln`. You can double-click this file to open the solution in Visual Studio.

If you plan on using Visual Studio to debug your program, you can change `render` project in the Solution Explorer as the startup project by right-clicking on it and selecting `Set as StartUp Project`. You can also set the command line arguments to the project by right-clicking `render` project again, selecting `Properties`, going into the `Debugging` tab, and setting the value in `Command Arguments`. If you want to run the program with the test folder, you can set this command argument to `../../media/sphere/sphere.json`. After setting all these, you can hit F5\press `Local Windows Debugger` button to build your program and run it with the debugger.

You should also change the build mode to `Release` from `Debug` occasionally by clicking the Solution Configurations drop down menu on the top menu bar, which will make your program run faster. Note that you will have to set `Command Arguments` again if you change the build mode. Note that your application must run properly in both debug and release build.

## Summary of Viewer Controls

A table of all the keyboard controls in the application is provided below.

| Command                                  |  Key  |
| ---------------------------------------- | :---: |
| Toggle pattern control display           |   p   |
| Increase rust pattern threshold          |   =   |
| Decrease rust pattern threshold          |   -   |
| Reset camera to default position         |   r   |
| Print camera parameters                  | SPACE |

### Part 1: Implementing Phong Reflectance and Material Pattern Generation (30%)

To complete this assignment, you'll be writing shaders in a language called GLSL (OpenGL Shading Language).  GLSL's syntax is C/C++ "like", but it features a number of builtin types specific to graphics. In this assignment, there are two shaders, a __vertex shader__ `shader.vert` that is executed _once per vertex_ of each rendered triangle mesh.  And a __fragment shader__ `shader.frag` that executes _once per fragment_ (aka. once per screen sample covered by a triangle.)

We didn't specifically talk about the specifics of GLSL programming in class, so you'll have to pick it up on your own. Fortunately, there are a number of great GLSL tutorials online, but we recommend [The Book of Shaders](https://thebookofshaders.com/).  Here are a few things to know:

* You'll want to start by looking at `main()` in both `shader.vert` and `shader.frag`.  This is the function that executes once per vertex or once per fragment.

* Make sure you known difference between __uniform parameters__, which are read-only values that take on the same value for all invocations of a shader, and __varying values__ that assume different values for each invocation.  Per-vertex input attributes are inputs to the vertex shader that have a unique value per vertex (such as position, normal, texcoord, etc.).  The vertex's shader's outputs are interpolated by the rasterizer, and then the interpolated values are provided as inputs to the fragment shader when it is invoked for a specific surface point.  Notice how the name of the vertex shader's output variables matches the name of the fragment shader's varying inputs.

* The assignment stater code JIT compiles your GLSL vertex and fragment shaders on-the-fly when the `render` application starts running.  Therefore, you won't know if the code successfully compiles until run time.  If you see a black screen while rendering, it's likely because your GLSL shader failed to compile.  __Look to your console for error messages about a failed compile.__


#### 1.1 Phong Reflectance (15%)

In the first part of this assignment you will implement two important aspects of defining a material.  First, you will implement a simple BRDF that implements the phong reflectance model to render shiny red car.  Then you will implement logic that computes spatially varying input parameters to this model by combining two material layers: the shiny red car paint and a layer representing rust.

To begin, render the sport scar scene using the command:

    ./render ../media/sportscar/sportscar.json

You should see an image that looks a bit like the one below:

![Sports car starter image](misc/sportscar_starter.png?raw=true)

__What you need to do:__

Notice that all parts of the car are rendered in a basic diffuse material.  To make the car shiny, we'd like you to replace the reflectance implementation in `BRDF_Evaluate()` in `media/shader.frag` with an implementation of the [Phong Reflectance](https://en.wikipedia.org/wiki/Phong_reflection_model) model.  Your implementation should compute the diffuse and ambient components of this reflectance model in `BRDF_Evaluate()`.  Note that the ambient term is independent of scene light sources and should be added in to the total surface reflectance outside of the light integration loops.  

A correct implementation of Phong reflectance should yield a shiny car, like this:

![Sports car with phong](misc/sportscar_phong.png?raw=true)

#### 1.2. Pattern Evaluation (15%)

In part 1 above, the diffuse color of the car was an input to the fragment shader.  However, it's very common for shaders to evaluate complex expressions to generate input parameters to brdfs. This is common when the properties of a surface change due in an interactive application.  For example, in the sports car scene, the appearance of the car might change from shiny to rusted in response to user input. In real games, a shader might execute a large number on computations to blend together many different texture maps to achieve a desired dynamic look. (This phase of shading is often called "pattern generation" since it involves evaluating a pattern on the surface.) See [this example](http://graphics.stanford.edu/courses/cs248-18-spring/lecture/materials/slide_070) and [this complex example](http://graphics.stanford.edu/courses/cs248-18-spring/lecture/materials/slide_071) from lecture for forms of pattern generation.

__What you need to do:__

We want you to implement a function that combines the shiny red appearance of the car, with a rusty texture, based on the value of the fragment shader input parameter `layer_blend_thresh`.  In the app, you can change the value of `layer_blend_thresh` using the '+/-' keys, turning the shiny red car into a rusty one.   The output of this blending computation will be a value of `diffuse_color` and `specular_color` passed to the brdf.

* Take a look at `media/sportscar/image/layer_blend.png`.  This texture, which is available to the fragment shader as the texture variable `blendTextureSampler`, is a mask that governs how much to blend between the red shiny material of the car, and a duller rusty look.  For example, one simple blending function that mixes in rust on the car as you increase `layer_blend_thresh` with the '+' key is::

    float blend = layer_blend_thresh * texture2D(blendTextureSampler, texcoord).r;
    diffuseColor = paint_color * (1.0 - blend) + texture2D(diffuseTextureSampler, texcoord).rgb * blend;

When `layer_blend_thresh` is set to the maximum value of 1.0, you'd see an image that looks like this:

![Sports car with rust](misc/sportscar_rust.png?raw=true)

The blending function above is simple, and there are other effects you could consider.  For example, instead of fading on the rust as is done with the code above, it is possible to achieve an effect "grow" the rust texture on the car (simulating a weathering effect) if you used a predicate that only blended in rust effects when `texture2D(blendTextureSampler, texcoord).r < layer_blend_thresh`. You might consider adjusting the `specularColor` to reduce material shininess in rusty areas.  See what you can come up with, there is no right answer for this part of the assignment.

### Part 2: Adding Environment Lighting (30%)

In part 1, your shaders used simple point and directional light sources in the scene. (Notice that in `shader.frag` the code iterated over light sources and accumulated reflectance.)  We'd now like you to implement a more complex form a light source.  This light source, called an image based environment light, described [here in lecture](http://graphics.stanford.edu/courses/cs248-18-spring/lecture/materials/slide_036) represents light incoming on the scene from an _infinitely far source, but from all directions_.  Pixel (x,y) in the texture map encodes the magnitude and color and light from the direction (phi, theta).  Phi and theta encode a direction in [spherical coordinates](https://en.wikipedia.org/wiki/Spherical_coordinate_system).

__What you need to do:__

In `media/shader.frag`, we'd like you to implement a perfectly mirror reflective surface.  The shader should [reflect the vector](http://graphics.stanford.edu/courses/cs248-18-spring/lecture/materials/slide_049) from the surface to the camera about the surface normal, and the use the reflected vector to perform a lookup in the environment map.  A few notes are below:

* `dir2camera` conveniently gives you the direction from the surface _to the camera_.  It is not normalized.
* The function `vec3 EnvironmentMap(vec3 L)` takes as input a direction (outward from the scene), and returns the radiance from the environment light arriving from this direction (technically traveling from an infinitely far source in the opposite direction).
* To perform an environment map lookup, you have to convert the reflection direction from its 3D Euclidean representation to spherical coordinates phi and theta.  In this assignment rendering is set up to use a different coordinate system (where Y is up, X is pointing to the right, and Z is pointing toward the camera), so you'll need to adjust the standard equations of conversion accordingly.  Specifically, polar (or zenith) angle __theta__ is the angle between the direction and the Y axis.  The azimuthal angle __phi__ is zero when the direction vector is in the YZ plane, and increases as this vector rotates toward the XY plane. 

Once you've correctly implemented an environment map lookup, you'll be able to render a reflective teapot (`media/teapot/teapot.json`), as shown below. The sports car's windows are also mirror-like in appearance.

![Mirror teapot](misc/teapot_mirror.png?raw=true)

At this point the windows on the sports car are also reflective:

![sports car shiny](misc/sportscar_shiny.png?raw=true)

### Part 3: Normal mapping (30%)

The final programming task in this assignment is to implement [normal mapping](http://graphics.stanford.edu/courses/cs248-18-spring/lecture/texture/slide_048) to create the illusion of a surface having more detail that what is modeled by the underlying geometry.  They idea of normal mapping is to perturb the surface's geometric normal with an offset by a vector encoded in a texture map.  An example "normal map" is shown at right in the image below.

![Tangent space figure](misc/tangent_fig.png?raw=true)

Each RGB sample in the texture map encodes a 3D vector that is a perturbation of the geometry's actual normal at the corresponding surface point.  However, instead of encoding this offset in single coordinate space, just as object space, the vectors in the normal map are represented in the __surface's tangent space.___ Tangent space is a coordinate frame that is relative to the surface's orientation at each point. It is defined by the surface's normal, aligned with the Z-axis [0 0 1] in tangent space, and a tangent vector to the surface, corresponding to X-axis [1 0 0].  The tangent space coordinate frame at a point on the surface is given at left in the figure above.

Normal mapping works as follows, given a point on the surface, your shader needs to sample the normal map at the appropriate location to obtain the _tangent space normal_ at this point.  Then the shader should convert the tangent space normal to its world space representation so that the normal can be used for reflectance calculations. 

__What you need to do:__ 

First, modify the vertex shader `shader.vert` to compute a transform `tan2World`.  You should think about creating a rotation matrix that converts tangent space to object space, and then applying an additional transformation to move the object space frame world space.  The vertex shader emits `tangent2World` for later use in fragment shading.

* Notice that in `shader.vert` you are given the normal (N) and surface tangent (T) at the current vertex.  But you are not given the third vector, often called the "binormal vector" (B) defining the Y-axis of tangent space.  How do you compute this vector given the normal and tangent.
* How do you create a rotation matrix that takes tangent space vectors to object space vector?  [See this slide](http://graphics.stanford.edu/courses/cs248-18-spring/lecture/texture/slide_011) for a hint.

Second, in `shader.frag`, you need to sample the normal map ``, and then use `tan2World` to compute a world space normal at the current surface sample point.

We recommend that you debug normal mapping on the sphere scene (`media/sphere/sphere.json`).  

Without normal mapping, the sphere looks like a flat sphere with a brick texture, as shown at left. But with normal mapping, notice how the bumpy surface creates more plausible reflective highlights in the rendering on the right.

![Normal mapping](misc/normal_mapping.png?raw=true)

The Vespa scene also contains normal mapped surfaces. (`media/vespa/vespa.json`)

![Rusty vespa rendering](misc/vespa.png?raw=true)

### Part 4: Create a New Scene (10%)

Every team is required to submit a scene file (.json) representing a scene they made.  You can download 3D geometry from the internet, and make use of the Disney BRDF we provided in the starter code.  Take a look at [this lecture](http://graphics.stanford.edu/courses/cs248-18-spring/lecture/materials/slide_072) to tune Disney brdf. Thus, use of any 3D package or model repository is allowed to object 3D models, although the assignment only supports obj file's for geometry and png files for textures. ([Look here](https://en.wikipedia.org/wiki/Wavefront_.obj_file) for information on the obj file format.) It is your job to arrange objects to create a final scene.
We found [McGuire CGA](http://casual-effects.com/data/) and [Turbosquid](https://www.turbosquid.com/) useful for downloading free 3d models, [Online 3D Converter](http://www.greentoken.de/onlineconv/) for converting your mesh file to `.obj`.

Include this scene file, and any necessary mesh and texture assets in the root directory of your submission as scene.json.

### Extra Credit

There are number of ways to go farther in this assignment.  Some ideas include:

* Implement other BRDFs that are interesting to you.  Google terms like "physically based shading".  

* Consider adding more sophisticated light types, such as spotlights or area lights via [linear transformed cosine](https://eheitzresearch.wordpress.com/415-2/)

* It is significantly more work since it requires changing the C++ starter code to render the scene multiple times each frame, but you could consider modifying the source code to achieve effects such as transparent surfaces (car glass) shadow mapping (see `render_in_opengl()` in `src/dynamic_scene/scene.cpp`).

## Writeup

Additionally, you will submit a short document explaining what you have implemented, and any particular details of your submission. If your submission includes any implementations which are not entirely functional, please detail what works and what doesn't, along with where you got stuck. This document does not need to be long; correctly implemented features may simply be listed, and incomplete features should be described in a few sentences at most.

The writeup must be a pdf, markdown, or plaintext file. Include it in the root directory of your submission as writeup.pdf, writeup.md, or writeup.txt.

Failure to submit this writeup will incur a penalty on the assignment.

## Handin Instructions

We are using [Canvas](https://canvas.stanford.edu) as our submission tool. You should create and upload a tar archive of your entire src subdirectory along with the writeup (e.g. writeup.txt) and scene submission (scene.json).

## Acknowledgment

The vespa model is from [NVIDIA ORCA](https://developer.nvidia.com/orca), and the sports car model is created by [Yasutoshi Mori](https://github.com/MirageYM/3DModels). CS248 course staff would like to thank Professor Keenan Crane and Carnegie Mellon University's course assistants for providing assignment materials.
