#ifndef CS248_DYNAMICSCENE_ENVIRONMENTLIGHT_H
#define CS248_DYNAMICSCENE_ENVIRONMENTLIGHT_H

#include "scene.h"
#include "../image.h"
#include "../static_scene/light.h"

namespace CS248 {
namespace DynamicScene {

class EnvironmentLight : public SceneLight {
 public:
  EnvironmentLight(HDRImageBuffer* envmap) : envmap(envmap) {}

  StaticScene::SceneLight* get_static_light() const {
    StaticScene::EnvironmentLight* l =
        new StaticScene::EnvironmentLight(envmap);
    return l;
  }

 private:
  HDRImageBuffer* envmap;
};

}  // namespace DynamicScene
}  // namespace CS248

#endif  // CS248_DYNAMICSCENE_ENVIRONMENTLIGHT_H
